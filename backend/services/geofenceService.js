const { Geofence, Case, Trip, MovementRequest, User } = require('../models');
const turf = require('@turf/turf');
const fs = require('fs');
const path = require('path');


// Cache converted GeoJSON features for fast lookup
let districtGeoJSON = null;
let sectorGeoJSON = null;

function loadGeoJSON() {
  try {
    const distPath = path.join(__dirname, '../data/geojson/districts.json');
    const secPath = path.join(__dirname, '../data/geojson/sectors.json');
    if (fs.existsSync(distPath)) {
      districtGeoJSON = JSON.parse(fs.readFileSync(distPath, 'utf8'));
    }
    if (fs.existsSync(secPath)) {
      sectorGeoJSON = JSON.parse(fs.readFileSync(secPath, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to load spatial GeoJSON data:', err.message);
  }
}

loadGeoJSON();

const getDistrictBoundary = (districtName) => {
  if (!districtGeoJSON || !districtGeoJSON.features) return null;
  const match = districtGeoJSON.features.find(f => {
    const props = f.properties || {};
    const name = props.district || props.District || props.NAME_2 || props.name || props.ADM2_EN || '';
    return name.toString().toLowerCase().trim() === districtName.toString().toLowerCase().trim();
  });
  return match || null;
};

const getSectorBoundary = (sectorName) => {
  if (!sectorGeoJSON || !sectorGeoJSON.features) return null;
  const match = sectorGeoJSON.features.find(f => {
    const props = f.properties || {};
    const name = props.sector || props.Sector || props.NAME_3 || props.name || props.ADM3_EN || '';
    return name.toString().toLowerCase().trim() === sectorName.toString().toLowerCase().trim();
  });
  return match || null;
};

class GeofenceService {
  async getAllGeofences() {
    const fences = await Geofence.findAll({ order: [['createdAt', 'DESC']] });

    // Auto-repair any geofences stored with null geometry
    for (const fence of fences) {
      if (!fence.geometry) {
        if (fence.zone_type === 'DISTRICT' && fence.district_name) {
          const feat = getDistrictBoundary(fence.district_name);
          if (feat && feat.geometry) {
            fence.geometry = feat.geometry;
            await fence.save();
          }
        } else if (fence.zone_type === 'SECTOR' && fence.sector_name) {
          const feat = getSectorBoundary(fence.sector_name);
          if (feat && feat.geometry) {
            fence.geometry = feat.geometry;
            await fence.save();
          }
        }
      }
    }

    return fences;
  }

  async createGeofence(data) {
    const { name, rule_type, zone_type, district_name, sector_name, geometry, vehicle_plate, created_by } = data;
    
    let zoneGeometry = geometry;
    if (!zoneGeometry) {
      if (zone_type === 'DISTRICT' && district_name) {
        const feat = getDistrictBoundary(district_name);
        if (feat) zoneGeometry = feat.geometry;
      } else if (zone_type === 'SECTOR' && sector_name) {
        const feat = getSectorBoundary(sector_name);
        if (feat) zoneGeometry = feat.geometry;
      }
    }

    return await Geofence.create({
      name,
      rule_type: rule_type || 'ALLOWED',
      zone_type: zone_type || 'DISTRICT',
      district_name,
      sector_name,
      geometry: zoneGeometry,
      vehicle_plate: vehicle_plate ? vehicle_plate.trim().toUpperCase() : null,
      active: true,
      created_by
    });
  }

  async deleteGeofence(id) {
    const fence = await Geofence.findByPk(id);
    if (!fence) throw new Error('Geofence zone not found');
    await fence.destroy();
    return true;
  }

  async toggleGeofence(id) {
    const fence = await Geofence.findByPk(id);
    if (!fence) throw new Error('Geofence zone not found');
    fence.active = !fence.active;
    await fence.save();
    return fence;
  }

  async checkVehicleViolation(vehiclePlate, lat, lon) {
    if (!vehiclePlate || !lat || !lon) return null;

    const activeFences = await Geofence.findAll({
      where: {
        active: true
      }
    });

    // Filter fences for this specific vehicle or all vehicles
    const plateUpper = vehiclePlate.trim().toUpperCase();
    const relevantFences = activeFences.filter(f => !f.vehicle_plate || f.vehicle_plate.toUpperCase() === plateUpper);

    if (relevantFences.length === 0) return null;

    const pt = turf.point([parseFloat(lon), parseFloat(lat)]);

    for (const fence of relevantFences) {
      if (!fence.geometry) continue;

      let isInside = false;
      try {
        isInside = turf.booleanPointInPolygon(pt, fence.geometry);
      } catch (err) {

        console.error('Turf point-in-polygon error:', err.message);
        continue;
      }

      // Check FORBIDDEN rule (vehicle must NOT enter)
      if (fence.rule_type === 'FORBIDDEN' && isInside) {
        return {
          violation: true,
          reason: `Vehicle ${plateUpper} entered forbidden zone '${fence.name}'`,
          fence
        };
      }

      // Check ALLOWED rule (vehicle MUST stay inside)
      if (fence.rule_type === 'ALLOWED' && !isInside) {
        return {
          violation: true,
          reason: `Vehicle ${plateUpper} strayed outside allowed zone '${fence.name}'`,
          fence
        };
      }
    }

    return null;
  }
}

module.exports = new GeofenceService();

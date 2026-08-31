import { Provinces, Districts, Sectors } from 'rwanda';

const allDistricts = Districts();
const allProvinces = Provinces();

function getProvinceForDistrict(districtName) {
  for (const prov of allProvinces) {
    const dists = Districts(prov);
    if (dists && dists.map(d => d.toLowerCase()).includes(districtName.toLowerCase())) {
      return prov;
    }
  }
  return null;
}

const prov = getProvinceForDistrict('Gasabo');
console.log('Province of Gasabo:', prov);
console.log('Sectors of Gasabo:', Sectors(prov, 'Gasabo'));

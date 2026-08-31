import rwanda from 'rwanda';
console.log('Districts:', rwanda.Districts().length);
console.log('Provinces:', rwanda.Provinces());
console.log('Sectors in province East, district Bugesera?', rwanda.Sectors('East', 'Bugesera'));
// Let's try rwanda.Districts('Kigali')
// Actually, let's just use rwanda package in standard way.

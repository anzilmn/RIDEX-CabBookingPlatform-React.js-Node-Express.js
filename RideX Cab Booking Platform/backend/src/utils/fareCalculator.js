const BASE_FARE = { sedan: 50, suv: 80, hatchback: 40, motorcycle: 25, auto: 35 };
const PER_KM = { sedan: 12, suv: 18, hatchback: 10, motorcycle: 8, auto: 9 };
const PER_MIN = { sedan: 1.5, suv: 2, hatchback: 1.2, motorcycle: 0.8, auto: 1 };

function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function calculateFare(pickup, drop, vehicleType = 'sedan') {
  const distance = calcDistance(pickup.lat, pickup.lng, drop.lat, drop.lng);
  const duration = distance * 3; // ~20km/h avg
  const type = vehicleType || 'sedan';
  const fare = Math.round((BASE_FARE[type] || 50) + (distance * (PER_KM[type] || 12)) + (duration * (PER_MIN[type] || 1.5)));
  return { fare: Math.max(fare, 30), distance: parseFloat(distance.toFixed(2)), duration: Math.round(duration) };
}

module.exports = { calculateFare };

const { getTrips, getDriver, getVehicle } = require('api');
// const { getAllDrivers }  = require('./analysis');
/**
 * This function should return the data for drivers in the specified format
 *
 * Question 4
 *
 * @returns {any} Driver report data
 */

// filter driver ids to remove duplicates
const getAllDriverUniqueIds = (array) => {
  let driversArray = [];
  array.forEach((trip) => {
    driversArray.push(trip.driverID);
  });
  const uniqueDrivers = driversArray.filter((driver, index) => {
    return driversArray.indexOf(driver) == index;
  });
  return uniqueDrivers;
};

// use the unique ids of driver to fetch their details from getDriver and return driver information
const getDriversDetail = async (driversArr) => {
  const allDriversPromise = driversArr.map(async (driverID) => {
    try {
      const driver = await getDriver(driverID);
      driver.noOfVehicles = driver.vehicleID.length;
      driver.vehicleId = driver.vehicleID;
      driver.id = driverID;
      if (driver) return driver;
    } catch (error) {}
  });
  let allDrivers = await Promise.all(allDriversPromise);
  allDrivers = allDrivers.filter(Boolean);

  let result = [];
  // assign values as requested for tests
  allDrivers.forEach((driver) => {
    const newDriver = {
      name: driver.name,
      id: driver.id,
      phone: driver.phone,
      noOfVehicles: driver.noOfVehicles,
      vehicleId: driver.vehicleId,
    };
    result.push(newDriver);
  });
  return result;
};

// function to change billed amount to number
const reduceArrOfNumbers = (arr) => {
    let newValue = arr.map((trip) => new String(trip.billedAmount).replace(/,/g, '')).reduce((acc, cur) => parseFloat(acc) + parseFloat(cur), 0)
    newValue = Number(toFixed(2))
}

// function to get all trips for all drivers
const getNofOfTrips = (driversArray, tripsArray) => {

    //loop through unique ids and filter trips to get individual data for drivers, assign values as requested in arrayOfTrips as a placeHolder
  const getTrips = driversArray.map((driver) => {

    let arrayOfTrips = tripsArray.filter((trip) => trip.driverID === driver.id);
    driver.arrayOfTrips = arrayOfTrips;

    driver.noOfTrips = arrayOfTrips.length;
    driver.noOfCashTrips = arrayOfTrips.filter((trip) => trip.isCash).length;
    driver.noOfNonCashTrips = arrayOfTrips.filter(
      (trip) => !trip.isCash
    ).length;

    driver.totalAmountEarned = reduceArrOfNumbers(arrayOfTrips)
    driver.totalCashAmount = reduceArrOfNumbers(arrayOfTrips.filter((trip) => trip.isCash))
    driver.totalNonCashAmount = reduceArrOfNumbers(arrayOfTrips.filter((trip) => !trip.isCash))

    driver.trips = arrayOfTrips.map((trip) => {
      let obj = {};
      obj.name = trip.user.name;
      obj.created = trip.created;
      obj.pickup = trip.pickup.address;
      obj.destination = trip.destination.address;
      obj.billed = Number(new String(trip.billedAmount).replace(/,/g, ''))
      obj.isCash = trip.isCash;
      return obj;
    });
    return driver;
  });
  return getTrips;
};

// Function to get vehicle details of all drivers
const getVehicleDetails = async (allDrivers) => {

    // map through all drivers report data get driver ids and call getvehicle function for each driver, add vehicleArr option to data
  const allNewDRiversPromise = allDrivers.map(async (driver) => {
    const driverVehicles = driver.vehicleId;
    const vehicleArrayPromise = driverVehicles.map(async (id) => {
      const vehicle = await getVehicle(id);
      return vehicle;
    });
    const newVehicles = await Promise.all(vehicleArrayPromise);
    return { ...driver, vehicleArray: newVehicles };
  });

  // resolve all promises from map
  const result = await Promise.all(allNewDRiversPromise);

  //loop through resolved promises of mutated result object and add vehicles property
  const allNewDrivers = result.map((driver) => {
    let vehicles = [];
    driver.vehicleArray.forEach((el) => {
      vehicles.push({ plate: el.plate, manufacturer: el.manufacturer });
    });
    delete driver.arrayOfTrips;
    delete driver.vehicleArray;
    return { ...driver, vehicles };
  });
  return allNewDrivers;
};

async function driverReport() {
    const trips = await getTrips();
    const driversUniqueIdArray = getAllDriverUniqueIds(trips);
    const allDriversDetails = await getDriversDetail(driversUniqueIdArray);
    const driversNoOfTrips = getNofOfTrips(allDriversDetails, trips);
    const result = await getVehicleDetails(driversNoOfTrips);
    return result;
  }

module.exports = driverReport;
const { getTrips, getDriver } = require('api');

/**
 * This function should return the trip data analysis
 *
 * Question 3
 * @returns {any} Trip data analysis
 */

// create an array of unique driverIDs to pass in to moreThan one trips function
 const getRemovedDuplicateDriverIDs = (arr) => {

  let driverIDs = arr.map((trip) => {
    return trip.driverID
  });

  const noDuplicatesArr = driverIDs.filter((driver, position) => {
    return driverIDs.indexOf(driver) == position;
  });
  return noDuplicatesArr;
};

// function to convert invalid bill type to a valid bill amount
const reduceArrOfNumbers = (arr) => {
  return arr.map((trip) => new String(trip.billedAmount).replace(/,/g, '')).reduce((acc, cur) => parseFloat(acc) + parseFloat(cur), 0)
}


//function to create bills for analysis function return values
const totalBilled = (arr) => {
  const billedTotal = reduceArrOfNumbers(arr)
  const cashBilledTotal = reduceArrOfNumbers(arr.filter((trip) => trip.isCash))
  const nonCashBilledTotal = reduceArrOfNumbers(arr.filter((trip) => !trip.isCash))
  return {
    billedTotal: Number(billedTotal.toFixed(2)),
    cashBilledTotal: Number(cashBilledTotal.toFixed(2)),
    nonCashBilledTotal: Number(nonCashBilledTotal.toFixed(2)),
  }
}

// //function to return length of trips for both cash and noncash trips
const trips = (arr) => {
  const noOfCashTrips = arr.filter((trip) => trip.isCash).length
  const noOfNonCashTrips = arr.filter((trip) => !trip.isCash).length

  return {
    noOfCashTrips,
    noOfNonCashTrips
  }
}

// function to check and return number of drivers with more than one trips
const moreThanOneTrips = async (arr) => {
  let numberOfTrips = 0
  const promises = arr.map(async (driver) => {
    try {
      const driverDetails = await getDriver(driver);
      if (driverDetails) return driverDetails;
    } catch (error) {}
  });
  let allNewDrivers = await Promise.all(promises);
  allNewDrivers = allNewDrivers.filter(Boolean);
 
  allNewDrivers.forEach((driver) => {
    if (driver.vehicleID.length > 1) {
      numberOfTrips++;
    }
  });
  return numberOfTrips;
};


const mostTripsByADriver = async (trips) => {
  // create an b=object to count occurence of trips for each driver
  const driversObject = trips.reduce((tally, driver) => {
    tally[driver.driverID] = (tally[driver.driverID] || 0) + 1;
    return tally;
  }, {});

  //find the maximum number of trips
  const result = Math.max(...Object.values(driversObject));

  // create an array of arrays for drivers
  const x = Object.entries(driversObject);
  
  //filter this array to get drivers with the maximum number of trips
  const newX = x.filter(driver => driver[1] === result);
  const allDriverPromise = newX.map(async (driver) => {
    try {
      const driverDetails = await getDriver(driver[0]);
      driverDetails.id = driver[0]
      if (driverDetails) return driverDetails;
    } catch (error) {}
  });
  const allDriver = await Promise.all(allDriverPromise);
  const driverTrips = trips.filter((driver) => driver.driverID === allDriver[0].id)
  const totalAmountEarned = reduceArrOfNumbers(driverTrips)
  allDriver[0].totalAmountEarned = totalAmountEarned
  allDriver[0].noOfTrips = result
  return allDriver[0];
};

const getHighestEarningDriver = async (trips) => {

  // creates an object to get no of trips of all drivers
  let driversObject = trips.reduce((tally, driver) => {
    const bill = Number(new String(driver.billedAmount).replace(/,/g, ''))
    tally[driver.driverID] = (tally[driver.driverID] || 0) + bill;
    return tally;
  }, {});

  const highestEarned = trips.reduce((tally, driver) => {
    tally[driver.driverID] = (tally[driver.driverID] || 0) + 1;
    return tally;
  }, {});

  for (const property in driversObject) {
    driversObject[property] = Number(driversObject[property].toFixed(2));
  }

  const maxBill = Math.max(...Object.values(driversObject));
  const newObjArr = Object.entries(driversObject);
  const highestEarnerArr = newObjArr.filter((driver) => driver[1] === maxBill);
  const noOfTrips = highestEarned[highestEarnerArr[0][0]]
  const driver = await getDriver(highestEarnerArr[0][0]);

  const highestEarningDriver = {
    name: driver.name,
    email: driver.email,
    phone: driver.phone,
    noOfTrips: noOfTrips,
    totalAmountEarned: maxBill
  }
  return { highestEarningDriver }
};


async function analysis() {
  // Your code goes here
  const data = await getTrips()
  let newData = JSON.parse(JSON.stringify(data))
  let result = {}
  const { billedTotal, cashBilledTotal, nonCashBilledTotal } = totalBilled(newData)
  const { noOfCashTrips, noOfNonCashTrips } = trips(newData)
  const noDuplicatesArr = getRemovedDuplicateDriverIDs(newData)
  const noOfDriversWithMoreThanOneVehicle = await moreThanOneTrips(noDuplicatesArr)
  const highestDriver = await mostTripsByADriver(newData)
  const { highestEarningDriver } = await getHighestEarningDriver(newData)

  const mostTripsByDriver = {
    name: highestDriver.name,
    email: highestDriver.email,
    phone: highestDriver.phone,
    noOfTrips: highestDriver.noOfTrips,
    totalAmountEarned: highestDriver.totalAmountEarned
  }
  
  result = {
    billedTotal,
    cashBilledTotal,
    nonCashBilledTotal,
    noOfCashTrips,
    noOfNonCashTrips,
    noOfDriversWithMoreThanOneVehicle,
    mostTripsByDriver,
    highestEarningDriver
  }

  return result
}

module.exports = analysis;
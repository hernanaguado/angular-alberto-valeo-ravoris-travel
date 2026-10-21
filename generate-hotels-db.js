// Importar las dependencias necesarias
const fs = require('fs');
const { faker } = require('@faker-js/faker');

const NUM_HOTELS = 100;

const generateHotels = () => {
  const hotels = [];
  for (let id = 0; id < NUM_HOTELS; id++) {
    hotels.push({
      id: faker.string.uuid(),
      name: `Hotel ${faker.word.words(2)}`,
      image: faker.image.urlPlaceholder({ width: 240, height: 180, text: '' }),
      address: faker.location.streetAddress(),
      stars: faker.number.int({min: 1, max: 5}),
      rate: parseFloat(faker.number.float({min: 0, max: 5, fractionDigits: 1})),
      price: faker.number.float({min: 50, max: 1000, fractionDigits: 2}),
    });
  }
  return hotels;
};

const generateDb = () => {
  const data = {
    hotels: generateHotels()
  };

  fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
};

generateDb();
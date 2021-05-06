const fs = require('fs');

let data = fs.readFileSync("structure.json", "utf-8")

let obj = JSON.parse(data)

// GETTING ALL THE PRODUCTS
console.log(obj.seller.randomId[0].products)

// OUTPUT: 
/*
======================================
{
  productID: {
    productName: 'GIFT',
    description: 'This is a wonderful description',
    price: '1',
    stock: '5'
  },
  anotherID: {
    productName: 'Surprice',
    description: 'This is a wonderful description',
    price: '1000',
    stock: '1'
  }
}
======================================
*/

// GETTING A SPECIFIC PRODUCT 
console.log(obj.seller.randomId[0].products.productID)

/*
======================================
{
  productName: 'GIFT',
  description: 'This is a wonderful description',
  price: '1',
  stock: '5'
}
======================================
*/

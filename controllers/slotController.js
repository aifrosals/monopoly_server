exports.getSlotSellingPrice = function (level) {
    let price = 0;
    switch (level) {
        case 0:
          {
            price = 1000;
          }
          break;
        case 1:
          {
            price = 1500;
          }
          break;
        case 2:
          {
            price = 2000;
          }
          break;
        case 3:
          {
            price = 3200;
          }
          break;
        case 4:
          {
            price = 4800;
          }
          break;
          case 5: {
              price = 6400;
          }
          break;
        default:
          {}
          break;
      }
      
      return price;
}
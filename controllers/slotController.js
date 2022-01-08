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

exports.getRandomPreviousSlot = function (index) {
  let limit = index - 1
  let randomPreviousSlot = Math.floor(Math.random() * limit)
  return randomPreviousSlot
}

exports.getCommunityChestCredits = function () {
  let num = Math.random()
  let credits = 0
  if(num <= 0.624) {
    let set = [5,10,15,20,25,30]  
    credits = set[Math.floor(Math.random() * 5)]
  }
  else if(num > 0.624 && num <= 0.926) {
    let set = [35,40,45,50]
    credits = set[Math.floor(Math.random() * 3)]
  }
  else if(num > 0.926) {
    credits = (Math.random() >= 0.5) ? 55 : 60
  }
   return credits
}
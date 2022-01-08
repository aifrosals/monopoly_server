var slot_names = [
    {
      name: 'Business Center',
      type: 'business_center'
    },
    {
      name: 'Theme Park',
      type: 'theme_park'
    }
  ]

  //* generate random number between 0 and 5
 function getRandomSlotName() {
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

var randomName = getRandomSlotName()
console.log(randomName)

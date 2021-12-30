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
  
 function getRandomSlotName() {
    let i = (Math.random() >= 0.5) ? 1 :0
    return slot_names[i]
  }

var randomName = getRandomSlotName()
console.log(randomName)
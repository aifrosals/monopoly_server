const rug = require('random-username-generator')
var someDate = new Date();
for(var i = 0 ; i < 7 ; i++)
    {
someDate.setDate(someDate.getDate() + 1);   
        console.log(someDate)
    }

    let userName = rug.generate()
    console.log(userName)

    const email = 'A@A.com'
    console.log(email)
    console.log(email.toLowerCase())
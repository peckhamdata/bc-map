const puppeteer = require('puppeteer');

let _browser;
let _page;

async function please_wait() {
  console.log('you wait')
  let myFirstPromise = new Promise((resolve, reject) => {
    setTimeout( function() {
      console.log('time passes');   
      resolve("Success!") 
    }, 1000) 
  }) 

  return myFirstPromise
}

async function run() {
  const browser = await puppeteer.launch({dumpio: true, args: [
	  '--headless', '--use-gl=desktop', "--proxy-server='direct://'", "--proxy-bypass-list=*"
]})
const page = await browser.newPage()
await page.setViewport({
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1,
});
await page.goto('http://127.0.0.1:8080/index.html')
for (var i=0; i < 10000; i++) {	
  await please_wait()	
  console.log('taking screenshot')
  var num = ('0000'+ i).slice(-4);
  await page.screenshot({ path: 'public/screenshot'+ num + '.png' })
}
browser.close();
}

run();

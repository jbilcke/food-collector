const fs = require('fs')
const { promisify } = require('util')
const readDir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const guessType = (restaurant, title, description) => {

  // here we try to get the restaurant name and not the area
  const cleanRestaurant = restaurant.toLowerCase().split(' - ')[0]
  
  // here we try to remove the restaurant name from the description eg 'BIOBURGER'
  const cleanDescription = description.toLowerCase().replace(cleanRestaurant, '')

  const model = {
    kebab: 'sandwich kebab|sandiwch grec',
    biryani: 'biryani',
    burger: '(?:hamb|cheese)?burg(?:é|er)',
    hotdog: 'hotdog|hot dog',
    friedchicken: 'poulet pané frit|fried chicken',
    pizza: 'pizza',
    bobun: '(?:bobun|bo bun|bun bo|bòbún|bò bún|bún bò nam bộ|bún bò|bún thịt nướng bò)',
    pasta: 'pâtes|pates|pasta|spaghetti|linguine|orechiette|tagliolini',
    risotto: 'risotto',
    acaibowl: 'a(?:c|ç)ai bowl',
    noodles: 'noodles|nouilles',
    ceviche: 'ceviche',
    chirashi: 'chirashi',
    donburi: 'donburi',
    bibimbap: 'bibimbap',
    burrito: 'burrito',
    'taco': 'tacos?',
    avocadotoast: 'avocado toast|tartine d\'avocat|tartine à l\'avocat',
    naan: 'naan',
    nachos: 'nachos',
    fries: 'fries side|side fries|grandes? frites?|moyennes? frites?|petites? frites?|barquette de frites?',
    gingerbeer: 'ginger ?beer',
    beer: 'brooklyn lager|demory|duvel|heineken|kronenbourg|asahi|kirin|tsing ?tao|hoegaarden|1664|bière|beer|peroni|budweiser|gallia|corona|bud light|carlsberg|singha|moretti|la goule|goudale|skumenn|bap ?bap|donovan',
    milkshake: 'milkshake',
    wine: 'vin en pichet|pichet de vin|vin blanc|vin rouge|vin rosé|bordeaux|pinot|chardonnay|rosé de provence|chablis',
    champagne: 'champagne',
    coke: 'coca(?: |-)?cola|breizh cola|pepsi cola|coca|cola|pepsi|coke',
    sparklingwater: 'badoit|san pellegrino|perrier',
    drink: 'schweppes|fanta|tropico|limonade|citronnade|dr pepper|7 ?up|oasis|orangina|sprite|ice ?tea|jarrito|lassi',
    water: 'cristaline|evian|vittel',
    croissant: 'croissant',
    chocolatine: 'chocolatine|pain au chocolat',
    pastry: 'gauffre|beignets?|chouquettes?|cookies?|éclair au chocolat|pain au raisin|pain suisse',
    dessert: 'mousse au chocolat|tiramisu|pann?a ?cott?a',
    cake: 'cheesecake|carrotcake|cake|fraisier|forêt noire',
    crepe: 'cr(?:ê|è|e)pe|froment|blé noir',
    pokebowl: 'pok(?:e|é)\s?bowl',
    sandwich: 'sandwich(?:es)?',
    bagel: 'bagels?',
    salad: 'salade?',
  }
  return Object.entries(model).reduce((acc, [key, pattern]) => {
    const regexp = new RegExp(pattern, 'i')
    if (title.match(regexp) || cleanDescription.match(regexp)) {
      return acc.concat(key)
    } else {
      return acc
    }
  }, [])
}

async function parseDirectory (directory) {
  const filenames = await readDir(directory)
  const db = {}
  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i]
    // console.log('filename: ' + filename)
    try {
      const str = await readFile(directory + filename, {encoding: 'utf8'})
      // console.log('str: ' + str)
      const allData = JSON.parse(str.split('INITIAL_STATE = ')[1].split('window.csrfToken')[0].replace('};', '}'))
      
      const firstStore = Object.entries(allData.eaterStores.eaterStores)[0][1]

      const sectionsItems = Object.entries(
        firstStore.data.store.sectionEntitiesMap
      ).reduce((acc, item) => acc.concat(
        Object.entries(item[1].itemsMap).map(item => item[1])
      ), [])

      const restaurant = filename.split(' Delivery _ Paris _')[0]
      sectionsItems.forEach(item => {
        db[`${restaurant} >> ${item.title}`] = {
          // id: item.title,
          restaurant: restaurant,
          type: guessType(restaurant, item.title, item.itemDescription)[0],
          price: (item.price / 100).toString().replace('.', ','),
          name: item.title,
          description: item.itemDescription,
        }
      })
    } catch (exc) {
      
    }
  }

  console.log('"restaurant";"type";"prix";"nom";"description"')
  Object.entries(db).forEach(([ id, item ]) => {
    console.log(
      Object.entries(item).map(value => JSON.stringify(value[1])).join(";")
    )
  })
}
parseDirectory('./data/').catch(console.error)

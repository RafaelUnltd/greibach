const fs = require('fs')

const Greibach = require('./greibach/resolver')

function main () {
  const fileName = process.argv.slice(2)[0]

  if (fileName) {
    fs.readFile(`./entries/${fileName}`, 'utf8', (err, response) => {
      if (err) {
        console.log(`Falha na leitura do arquivo. Existe um arquivo na pasta /entries com o nome "${fileName}"`, err)
        return
      }
      const greibach = new Greibach(JSON.parse(response).glc)
      const result = JSON.stringify(greibach.solve())
      console.log(result)
    })
  } else {
    console.log('Falha ao executar. Execute o programa da seguinte forma: "node index.js <NOME_DO_ARQUIVO.json>"')
  }
}

main()

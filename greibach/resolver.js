// Greibach solver class initializer
function Greibach (glc) {
  // Separating entry variables
  this.variables = glc[0]
  this.symbols = glc[1]
  this.rules = glc[2]
  this.startingPoint = glc[3]

  // Stores the current last variable name, so we can increment
  this.currentLastChar = this.variables[this.variables.length - 1]

  // Stores variable weights
  this.enumeration = {}

  // Stores all the variable names created in execution time
  this.addedRuleGroups = []

  // Initializes the enumeration
  this.variables.forEach((variable, index) => {
    this.enumeration[variable] = index + 1
  })
}

// Increments the current las char, to generate more rule groups
Greibach.prototype.iterateNextChar = function () {
  this.currentLastChar = String.fromCharCode(this.currentLastChar.charCodeAt(0) + 1)
  this.addedRuleGroups.push(this.currentLastChar)
  return this.currentLastChar
}

// Gets the index in the "rules" array where the variable rules start
Greibach.prototype.getVariableStartIndex = function (variable) {
  return this.rules.findIndex((rule) => rule[0] === variable)
}

// Gets all rules in the "rules" array tha belong to the given variable
Greibach.prototype.getVariableRules = function (variable) {
  return this.rules.filter((rule) => rule[0] === variable)
}

// Util that add a set of rules after an index in the "rules" array
Greibach.prototype.addRulesAfter = function (index = 0, rules) {
  rules.forEach(rule => {
    this.rules.splice(index, 0, rule)
  })
}

Greibach.prototype.hasSymbolsRight = function (rule) {
  for (let i = 1; i < rule.length; rule++) {
    if (this.symbols.includes(rule[i])) {
      return true
    }
  }

  return false
}

Greibach.prototype.removeSymbolsRight = function (rule) {
  let localRule = rule

  for (let i = 1; i < localRule.length; i++) {
    if (this.symbols.includes(localRule[i])) {
      const lastChar = this.iterateNextChar()
      this.rules.push([lastChar, localRule[i]])
      localRule = localRule.replace(localRule[i], lastChar)
      this.variables.push(lastChar)
    }
  }

  return localRule
}

Greibach.prototype.preprocess = function () {
  const newRules = {}

  this.rules.forEach((rule, index) => {
    const localRule = rule

    if (localRule[1].length > 1) {
      while (this.hasSymbolsRight(localRule[1])) {
        const ruleChanged = this.removeSymbolsRight(rule[1])
        localRule[1] = ruleChanged
      }
    }

    if (localRule[1] !== rule[1]) {
      newRules[index] = localRule[1]
    }
  })

  Object.keys(newRules).forEach((index) => {
    this.rules[index][1] = newRules[index]
  })
}

// If there is A -> By, for |y| >= 1, in wich #A > #B, replace B
Greibach.prototype.algo_2_1 = function (variable) {
  const start = this.getVariableStartIndex(variable)
  const variableWeight = this.enumeration[variable]
  const rulesToRemove = []

  let variableRules = this.getVariableRules(variable)
  let shouldRecall = false

  variableRules.forEach((rule) => {
    if (this.variables.includes(rule[1][0]) && variableWeight > this.enumeration[rule[1][0]]) {
      const updateRules = this.rules.filter((updateRule) => updateRule[0] === rule[1][0])

      updateRules.forEach((updateRule) => {
        variableRules.push([rule[0], rule[1].replace(rule[1][0], updateRule[1])])
      })

      rulesToRemove.push(rule)
      shouldRecall = true
    }
  })

  rulesToRemove.forEach((ruleToRemove) => {
    variableRules = variableRules.filter((rule) => rule[1] !== ruleToRemove[1])
  })

  this.rules = this.rules.filter((rule) => rule[0] !== variable)

  this.addRulesAfter(start, variableRules)

  // Verify again if there are any cases in the same rule group
  if (shouldRecall) {
    this.algo_2_1(variable)
  }
}

// If there is A -> Ay, for |y| >= 1, eliminate left recursion
Greibach.prototype.algo_2_2 = function (variable) {
  const start = this.getVariableStartIndex(variable)
  let counter = start

  const withRecursion = []
  const withoutRecursion = []

  while (counter < this.rules.length && this.rules[counter][0] === variable) {
    // If this occurs, there is recursion
    if (this.rules[counter][1][0] === variable) {
      withRecursion.push(this.rules[counter])
    } else {
      withoutRecursion.push(this.rules[counter])
    }
    counter++
  }

  if (withRecursion.length > 0) { // If there is any recursion for the variable rules
    const vRules = []

    const newRuleGroup = this.iterateNextChar()

    // Rewrite rules that dont present any recursion
    withoutRecursion.forEach((rule) => {
      const updatedRule = [rule[0], rule[1] + newRuleGroup]
      vRules.push(rule)
      vRules.push(updatedRule)
    })

    // Add rules to the new generated group
    withRecursion.forEach((rule) => {
      this.rules.push([newRuleGroup, rule[1].substring(1)])
      this.rules.push([newRuleGroup, rule[1].substring(1) + newRuleGroup])
    })

    this.rules = this.rules.filter((rule) => rule[0] !== variable) // Remove all old rules

    this.addRulesAfter(start, vRules)

    // If there was any recursion, the function will run again to check any left/generated cases
    this.algo_2_2(variable)
  }
}

Greibach.prototype.algo_3_and_4 = function (variable) {
  const start = this.getVariableStartIndex(variable)
  const rulesToRemove = []

  let variableRules = this.getVariableRules(variable)

  variableRules.forEach(rule => {
    if (this.variables.includes(rule[1][0])) {
      const replaceRules = this.rules.filter(replaceRule => replaceRule[0] === rule[1][0])
      rulesToRemove.push(rule[1])

      replaceRules.forEach(replaceRule => {
        variableRules.push([variable, rule[1].replace(rule[1][0], replaceRule[1])])
      })
    }
  })

  this.rules = this.rules.filter(rule => rule[0] !== variable)
  variableRules = variableRules.filter(rule => !rulesToRemove.includes(rule[1]))

  this.addRulesAfter(start, variableRules)
}

Greibach.prototype.solve = function () {
  // Makes a variable for everything after first symbol
  this.preprocess()

  // Executes the second step of the algorithm in increasing keys
  Object.keys(this.enumeration).forEach(variable => {
    this.algo_2_1(variable)
    this.algo_2_2(variable)
  })

  // Executes the third step of the algorithm, replacing left variables in reverse
  Object.keys(this.enumeration).reverse().forEach(variable => {
    this.algo_3_and_4(variable)
  })

  // Executes the fourth step of the algorithm, replacing left variables for the added groups
  this.addedRuleGroups.forEach(variable => {
    this.algo_3_and_4(variable)
  })

  // Returns the result in the right format
  return {
    glc: [
      this.variables.concat(this.addedRuleGroups),
      this.symbols,
      this.rules,
      this.startingPoint
    ]
  }
}

module.exports = Greibach

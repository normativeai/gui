var logger = require('../config/winston');
var xmlParser = require('./xmlParser');

function parseFormula(obj, state) {
  if (obj.hasOwnProperty('connective')){
		if (isMacro(obj.connective.code)) {
			return parseMacro(obj, state)
		} else {
			return parseConnector(obj, state);
		}
  } else if (obj.hasOwnProperty('term')){
    return obj.term.name;
  } else if (obj.hasOwnProperty('goal')){
    return parseGoal(obj);
  } else {
    throw {error: `Frontend error: The formula type ${obj.code} is not known.`};
  }
}

function parseGoal(obj) {
  return parseFormula(obj.goal.formula);
}

function parseConnector(obj, state) {
  if (!state || state.pass == 3) {
    var formulas = obj.connective.formulas.map(f => parseFormula(f, state));
    var argsNum = expectedArgs(obj.connective.code);
    if (argsNum < 0 && formulas.length < 2) {
      throw {error: `The sentence ${obj.text} contains the connective ${obj.connective.name} which expectes at least two operands, but ${formulas.length} were given.`}
    }
    if (argsNum >= 0 && formulas.length != argsNum) {
      throw {error: `The sentence ${obj.text} contains the connective ${obj.connective.name} which expectes ${argsNum} operands, but ${formulas.length} were given.`}
    }
    switch (obj.connective.code) {
      case "neg":
        return `(~ ${formulas[0]})`;
      case "or":
        return formulas.slice(1).reduce(function(acc, val) {
          return `(${acc} ; ${val})`
        }, formulas[0]);
      case "and":
        return formulas.slice(1).reduce(function(acc, val) {
          return `(${acc} , ${val})`
        }, formulas[0]);
      case "eq":
        throw "Equality operators are not yet supported!"
      case "defif":
        return `(${formulas[0]} => ${formulas[1]})`;
      case "defonif":
        return `(${formulas[1]} => ${formulas[0]})`;
      case "ob":
        return `(Ob ${formulas[0]})`
      case "pm":
        return `(Pm ${formulas[0]})`
      case "fb":
        return `(Fb ${formulas[0]})`
      case "id":
        return `(Id ${formulas[0]})`
      case "obif":
        return `(${formulas[0]} O> ${formulas[1]})`;
      case "obonif":
        return `(${formulas[1]} O> ${formulas[0]})`;
      case "pmif":
        return `(${formulas[0]} P> ${formulas[1]})`;
      case "pmonif":
        return `(${formulas[1]} P> ${formulas[0]})`;
      case "spmif":
        return `((${formulas[0]} P> ${formulas[1]}), ((~ ${formulas[0]}) O> (~ ${formulas[1]})))`;
      case "spmonif":
        return `((${formulas[1]} P> ${formulas[0]}), ((~ ${formulas[1]}) O> (~ ${formulas[0]})))`;
      case "fbif":
        return `(${formulas[0]} F> ${formulas[1]})`;
      case "fbonif":
        return `(${formulas[1]} F> ${formulas[0]})`;
      case "equiv":
        return `(${formulas[0]} <=> ${formulas[1]})`;
       default:
        throw {error: `Frontend error: Connective ${obj.connective.code} is not known.`};
    }
  }
}

function parseMacro(obj, state) {
	let formulas =  obj.connective.formulas
  var argsNum = expectedArgs(obj.connective.code);
  if (argsNum < 0 && formulas.length < 2) {
    throw {error: `The sentence ${obj.text} contains the connective ${obj.connective.name} which expectes at least two operands, but ${formulas.length} were given.`}
  }
  if (argsNum >= 0 && formulas.length != argsNum) {
    throw {error: `The sentence ${obj.text} contains the connective ${obj.connective.name} which expectes ${argsNum} operands, but ${formulas.length} were given.`}
  }
  switch (obj.connective.code) {
    case "label":
      /*
       * This macro allows for the labeling of formulae
       * The formulae is parsed as usual and is returned by this method
       * At the same time, it is indexed by the term and is stored in this jsonParser for further use
       * This happens in pass # 1
       */
      if (!state) {
        throw {error: "Frontend error: Labels can only used on top level sentences in legislation"}
      }
      if (!formulas[0].hasOwnProperty('term')) {
        throw {error: `Frontend error: ${obj.connective.name} must have a term on the first argument.Got instead ${JSON.stringify(formulas[0])}`};
      }
      const label = parseFormula(formulas[0], state)
      if (state.pass == 1) {
        // we sometime need to try and parse the formula contained within. we anyway store the non parsed version in the state
        // since we might need to manipulat it in json form
        parseFormula(formulas[1], state)
        setInState(label, formulas[1], state)
      } else if (state.pass == 3) {
        return parseFormula(getFromState(label, state), state)
      }
      return
    case "exception":
      /*
       * This macro adds the rhs as an exception to the formulas labeled in positions 0...length-2
       * This happens in pass # 2
       */

      if (!state) {
        throw {error: "Frontend error: Exceptions can only used on top level sentences in legislation"}
      }
      if (!state || state.pass != 2) {
        // doing nothing
        return
      }
      // We need to get the formulas with the labels and add the formula as a precondition.
      // TODO: the condition should be naf (negation as failure)

      // extract condition
      let condition = formulas[formulas.length-1]
      formulas.slice(0, -1).forEach(term => {
        if (!isTerm(term)) {
          throw {error: `Frontend error: Labels must be terms, got ${JSON.stringify(term)}`}
        }
        let label = parseFormula(term, state)
        let form = getFromState(label, state)
        // extract labels and make sure they are terms and that they appear in the state
        // create an implication with the condition on the left
        // Note, when applying an exception to obmacro1 (and maybe other future macros),
        // we need to add the exception within the macro and not to an implication to the macro

        if (form.hasOwnProperty('connective') && (form.connective.code == 'obmacro1')) {
          // we need to get the left hand side of form, apply the below create connective
          // and replace the first formula inside form (lhs)
          let curCond = form.connective.formulas[0]
          let newCond = createConnective('and', [createConnective('neg', [condition]), curCond])
          form.connective.formulas[0] = newCond
          setInState(label, form, state)
        } else {
          let newform = createConnective('defif', [createConnective('neg', [condition]), form])
          setInState(label, newform, state)
        }
      })
    case "obmacro1":
      if (state && (state.pass != 3)) {
        return
      }
			/*
				This macro simulates obif but accepts a multi obligation rhs (as a conjunction).
				The first element in the conjuct is the term to place in the obligation (containing the VAR value)
        VAR can also be contained on the left hand side
				It creates one obligation for each other conjunct on the rhs while replacing the macro VAR in the
					first element with the term in the conjunct.
				If the conjuct is not a term but an implication, it addes all the lhs of the implication to the lhs of the obligation.
			*/
			// ensure second argument is a conjunction
			if (!formulas[1].hasOwnProperty('connective') || !isOfType(formulas[1].connective, "and")) {
				throw {error: `Frontend error: ${obj.connective.name} must have a conjunct on the second argument.`};
			}
			// parse conjunction
			//let conj = formulas[1].connective.formulas.map(parseFormula)
			// extract ob rhs from conjunction
			let obform = parseFormula(formulas[1].connective.formulas[0], state)
			let conj = formulas[1].connective.formulas.slice(1)
			// lhs
			let lhs = formulas[0]
			// define function combining everything for each conjunct in conj
			let combine = function(conjunct) {
				var clhs
				var crhs
				// if conjunct is a implication, obtain lhs and rhs
				if (conjunct.hasOwnProperty('term')) {
					clhs = parseFormula(lhs, state)
					crhs = parseFormula(conjunct, state)
				} else if (isOfType(conjunct.connective, "defif")) {
					// merge the lhs of the conjunct with that of the expression
					let bigand = createConnective('and', [lhs, conjunct.connective.formulas[0]])
					// parse bigand
					clhs = parseFormula(bigand, state)
					crhs = parseFormula(conjunct.connective.formulas[1], state)
				} else if (isOfType(conjunct.connective, "defonif")) {
					// merge the lhs of the conjunct with that of the expression
					let bigand = createConnective('and', [lhs, conjunct.connective.formulas[1]])
					// parse bigand
					clhs = parseFormula(bigand, state)
					crhs = parseFormula(conjunct.connective.formulas[0], state)
				} else {
					throw {error: `Frontend error: ${obj.connective.name} supports only terms or implications on the right hand side conjunct`};
				}
				// substitute cojunct for VAR in obform
				let obform2 = obform.replace('VAR', crhs)
				let clhs2 = clhs.replace('VAR', crhs)
				// return new obligation
				return `(${clhs2} O> ${obform2})`

			}
			return conj.slice(1).reduce(function(acc,c) {
				return `(${acc} , ${combine(c)})`
			},combine(conj[0]))

    case "obmacro1-copy":
      /*
       * This macro intends of copying a obmacro1 sentence and change it. It has 3 parts
       * 1) An optional conjunction of further conditions to each obligation in obmacro1
       * 2) Additional obligations, which include also the VAR one in the first position. in this case, the new VAR replaces the copied one
       * 3) The label of the copied sentence
       * Note that the other macro must be before this one in the text. Order is important here since
       * both are handled in the same pass.
       */
      if (!state) {
        throw {error: "Frontend error: Macro copy can only be used on top level sentences in legislation"}
      }
      if (state.pass == 2) {
        // doing nothing
        return
      }

      if (state.pass == 3) {
        return parseFormula(state.map.get(computeUniqueLabel(obj)))
      }


      // in the first pass, we create the new formula and store it using a unique label
      // in the third pass, we return the formula stored with the unique label

      // first, we obtain the three parts, there can be 2 or 3 formulae in total
      let optConds = formulas[formulas.length-3]
      let addObs = formulas[formulas.length-2]
      let targetMacro = formulas[formulas.length-1]

      // check that the target macro is indicated using a term
      if (!isTerm(targetMacro)) {
        throw {error: `Frontend error: Labels must be terms, got ${JSON.stringify(targetMacro)}`}
      }

      // check that addObs contain a conjunction with VAR at the head
      if (!addObs.hasOwnProperty('connective') || addObs.connective.code != 'and' || !addObs.connective.formulas[0].term.name.includes('VAR')) {
        throw {error: `Frontend error: The additional obligations must be a conjunction with a VAR term in the first position`}
      }


      // ssecond, we obtain the target macro
      let label2 = parseFormula(targetMacro, state)
      let form = getFromState(label2, state)

      // we check that the target formula is indeed the right macro
      if (!form.hasOwnProperty('connective') || form.connective.code != 'obmacro1') {
        throw {error: `${obj.connective.name} can only copy from the relevant macro but got ${JSON.stringify(form.connective.code)}`}
      }

      // we need to replace its first formula with one containing the additional conditions, if they exist
      var conds = form.connective.formulas[0]
      if (optConds) {
        conds = createConnective('and', [optConds,conds])
      }

      // first remove the old VAR from a copy of the obligations
      let oldObs = form.connective.formulas[1].connective.formulas.slice()
      // remove the first element
      oldObs.splice(0,1)
      // add the new elements
      let obs = createConnective('and', addObs.connective.formulas.concat(oldObs))

      // lastly, we create a new obmacro1 with the new formulae
      setInState(computeUniqueLabel(obj), createConnective('obmacro1', [conds,obs]),state)
      return
    default:
      throw {error: `Frontend error: Macro ${obj.connective.code} is not known.`};
  }
}

function getFromState(label, state) {
  let form = state.map.get(label) // first get the formula from the state
  let unique = computeUniqueLabel(form) // compute the hash
  return state.map.get(unique) || form // return the chained labeled formula if exists
}

function setInState(label, form, state) {
  state.map.set(label, form)
}

// this is used in order to create unique labels for formulae to be stored in the state
function computeUniqueLabel(formula) {
  var hash = 0;
  let text = JSON.stringify(formula)
  for (var i = 0; i < text.length; i++) {
    var character = text.charCodeAt(i);
    hash = ((hash<<5)-hash)+character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash
}

function createConnective(conn, formulas) {
  let con = xmlParser.ops[conn]
	return {
			text:"Text cannot be retrieved currently as it is generated by a macro (TODO)",
			connective:
			{
				name: con.name,
				description: con.description,
				code: conn,
				formulas: formulas
			}
		}
}

function isTerm(obj) {
  return obj.hasOwnProperty('term')
}


function isOfType(connective, type) {
	return (connective.code == type)
}

function isMacro(code) {
	switch (code) {
		case "label":
		case "exception":
		case "obmacro1":
		case "obmacro1-copy":
			return true;
		default:
			return false;
	}
}

const obType = {
  OBLIGATION: 1,
  PROHIBITENCE: 2,
  SPERMISSION: 3 // the obligation generated from a strong permission
}

function extractViolations(obj) {
  if (obj.hasOwnProperty('connective')){
    switch (obj.connective.code) {
      case "and":
        const concat = (x,y) => x.concat(y)
        var ret = obj.connective.formulas.map(x => extractViolations(x)).reduce(concat, [])
        return ret
      case "obif":
        return extractFromObligation(obj.text, obj.connective.formulas[0], obj.connective.formulas[1], obType.OBLIGATION)
      case "obonif":
        return extractFromObligation(obj.text, obj.connective.formulas[1], obj.connective.formulas[0], obType.OBLIGATION)
      case "fbif":
        return extractFromObligation(obj.text, obj.connective.formulas[0], obj.connective.formulas[1], obType.PROHIBITENCE)
      case "fbonif":
        return extractFromObligation(obj.text, obj.connective.formulas[1], obj.connective.formulas[0], obType.PROHIBITENCE)
      case "spmif":
        return extractFromObligation(obj.text, obj.connective.formulas[0], obj.connective.formulas[1], obType.SPERMISSION)
      case "spmonif":
        return extractFromObligation(obj.text, obj.connective.formulas[1], obj.connective.formulas[0], obType.SPERMISSION)
      default:
        return []
    }
  } else {
    return []
  }
}

function extractFromObligation(text, lhs, rhs, ot) {
  var goal = rhs
  if (ot === obType.OBLIGATION) { // if we are doing an obligation and not a prohibition
    goal =
      {
        "text": `Negation of ${rhs.text}`,
        "connective": {
          "name": "Negation",
          "code": "neg",
          "formulas": [
            rhs
          ]
        }
      }
  }
  cond = lhs
  if (ot === obType.SPERMISSION) {
    cond =
      {
        "text": `Negation of ${lhs.text}`,
        "connective": {
          "name": "Negation",
          "code": "neg",
          "formulas": [
            lhs
          ]
        }
      }
  }
  return [{
      "text": `Violation of ${text}`,
      "connective": {
        "name": "Definitional Only If",
        "code": "defonif",
        "formulas": [
          {
            "text": "Violating the text",
            "term": {
              "name": "violation"
            }
          },
          {
            "text": text,
            "connective": {
              "name": "And",
              "code": "and",
              "formulas": [
                cond
                ,
                goal
              ]
            }
          }
        ]
      }
    }]
}

function expectedArgs(conCode) {
  switch (conCode) {
    case "defif":
    case "defonif":
    case "obonif":
    case "obif":
    case "pmonif":
    case "pmif":
    case "fbonif":
    case "fbif":
    case "eq":
    case "equiv":
		case "obmacro1":
		case "label":
      return 2
    case "neg":
    case "ob":
    case "pm":
    case "fb":
    case "id":
    case "neg":
      return 1
    default:
      return -1
  }
}

/*
 * Parsing is done by having three passes before returning formulae:
 * 1) Label all formulae
 * 2) Add exceptions
 * 3) compute formula taking into account all additional information which was gathered before
 */

module.exports  = { "parseFormula": parseFormula, "extractViolations": extractViolations,"arities": expectedArgs, "createConnective": createConnective };

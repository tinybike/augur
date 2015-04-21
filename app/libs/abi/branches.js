/**
 * Autogenerated from https://github.com/tinybike/augur-serpent/tree/master/serpent/data%20and%20api%20files
 * serpent mk_full_signature branches.se
 */
module.exports = [{
    "name": "addMarket(int256,int256)",
    "type": "function",
    "inputs": [{ "name": "branch", "type": "int256" }, { "name": "market", "type": "int256" }],
    "outputs": [{ "name": "out", "type": "int256" }]
},
{
    "name": "getBranch(int256)",
    "type": "function",
    "inputs": [{ "name": "branchNumber", "type": "int256" }],
    "outputs": [{ "name": "out", "type": "int256" }]
},
{
    "name": "getBranches()",
    "type": "function",
    "inputs": [],
    "outputs": [{ "name": "out", "type": "int256[]" }]
},
{
    "name": "getMarkets(int256)",
    "type": "function",
    "inputs": [{ "name": "branch", "type": "int256" }],
    "outputs": [{ "name": "out", "type": "int256[]" }]
},
{
    "name": "getMinTradingFee(int256)",
    "type": "function",
    "inputs": [{ "name": "branch", "type": "int256" }],
    "outputs": [{ "name": "out", "type": "int256" }]
},
{
    "name": "getNumBranches()",
    "type": "function",
    "inputs": [],
    "outputs": [{ "name": "out", "type": "int256" }]
},
{
    "name": "getNumMarkets(int256)",
    "type": "function",
    "inputs": [{ "name": "branch", "type": "int256" }],
    "outputs": [{ "name": "out", "type": "int256" }]
},
{
    "name": "getPeriodLength(int256)",
    "type": "function",
    "inputs": [{ "name": "branch", "type": "int256" }],
    "outputs": [{ "name": "out", "type": "int256" }]
},
{
    "name": "getStep(int256)",
    "type": "function",
    "inputs": [{ "name": "branch", "type": "int256" }],
    "outputs": [{ "name": "out", "type": "int256" }]
},
{
    "name": "getSubstep(int256)",
    "type": "function",
    "inputs": [{ "name": "branch", "type": "int256" }],
    "outputs": [{ "name": "out", "type": "int256" }]
},
{
    "name": "getVotePeriod(int256)",
    "type": "function",
    "inputs": [{ "name": "branch", "type": "int256" }],
    "outputs": [{ "name": "out", "type": "int256" }]
},
{
    "name": "incrementPeriod(int256)",
    "type": "function",
    "inputs": [{ "name": "branch", "type": "int256" }],
    "outputs": [{ "name": "out", "type": "int256" }]
},
{
    "name": "incrementStep(int256)",
    "type": "function",
    "inputs": [{ "name": "branch", "type": "int256" }],
    "outputs": [{ "name": "out", "type": "int256" }]
},
{
    "name": "incrementSubstep(int256)",
    "type": "function",
    "inputs": [{ "name": "branch", "type": "int256" }],
    "outputs": [{ "name": "out", "type": "int256" }]
},
{
    "name": "initializeBranch(int256,int256,int256,int256)",
    "type": "function",
    "inputs": [{ "name": "ID", "type": "int256" }, { "name": "currentVotePeriod", "type": "int256" }, { "name": "periodLength", "type": "int256" }, { "name": "minTradingFee", "type": "int256" }],
    "outputs": [{ "name": "out", "type": "int256" }]
},
{
    "name": "setStep(int256,int256)",
    "type": "function",
    "inputs": [{ "name": "branch", "type": "int256" }, { "name": "step", "type": "int256" }],
    "outputs": [{ "name": "out", "type": "int256" }]
},
{
    "name": "setSubstep(int256,int256)",
    "type": "function",
    "inputs": [{ "name": "branch", "type": "int256" }, { "name": "substep", "type": "int256" }],
    "outputs": [{ "name": "out", "type": "int256" }]
}];

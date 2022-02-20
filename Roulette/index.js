const web3 = require("@solana/web3.js");
const inquirer = require("inquirer");
const figlet = require("figlet");

const { getReturnAmount, totalAmtToBePaid, randomNumber } = require('./helper');
const {getWalletBalance,transferSOL,airDropSol}=require("./solana");




// Establishing Connection

const connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");

const init = () => {
    console.log(
        
            figlet.textSync("SOL Stake", {
                font: "Standard",
                horizontalLayout: "default",
                verticalLayout: "default"
            })
        
    );
    console.log(`The max bidding amount is 2.5 SOL`);
};


const userSecretKey = [
      182, 215,  23, 107,  41, 178,  61, 151, 148,   1, 235,
      135,  86,  29, 131, 140, 100, 114,  79, 251, 248,  10,
       48, 117,  19, 185, 150,  34,  16, 230, 206, 148, 170,
      209,  74,  19, 159,   5, 224, 119, 251,  28,  91, 105,
      181, 253, 153,  30, 214, 135,  85, 176,  25,  82, 122,
       52, 199, 157, 193, 158,   6, 138,  92,  77
    ];

const userWallet = web3.Keypair.fromSecretKey(Uint8Array.from(userSecretKey));

//Treasury

const secretKey = [
    166, 136, 108, 177, 141,   3,   1, 145,  40,  92,  59,
    117, 142, 132,  32, 192,  82, 208, 128,  56, 128,  45,
    248, 121, 207, 110, 106,  63,  32, 219, 147,  89, 224,
    162, 180,  62,  72, 210, 180, 105,   8, 117, 128, 245,
    193,  71, 124, 208,  72, 244, 242, 114,  41,  22,  19,
    172, 211, 184,  90, 183,  22,  45, 166, 183
  ];

const treasuryWallet = web3.Keypair.fromSecretKey(Uint8Array.from(secretKey));

const askQuestions = () => {
    const questions = [
        {
            name: "SOL",
            type: "number",
            message: "What is the amount of SOL you want to stake?",
        },
        {
            type: "rawlist",
            name: "RATIO",
            message: "What is the ratio of your staking?",
            choices: ["1:1.25", "1:1.5", "1.75", "1:2"],
            filter: function (val) {
                const stakeFactor = val.split(":")[1];
                return stakeFactor;
            },
        },
        {
            type: "number",
            name: "RANDOM",
            message: "Guess a random number from 1 to 5 (both 1, 5 included)",
            when: async (val) => {
                if (parseFloat(totalAmtToBePaid(val.SOL)) > 5) {
                    console.log(`You have violated the max stake limit. Stake with smaller amount.`)
                    return false;
                } else {
                    // console.log("In when")
                    console.log(`You need to pay ${`${totalAmtToBePaid(val.SOL)}`} to move forward`)
                    const userBalance = await getWalletBalance(userWallet.publicKey.toString())
                    if (userBalance < totalAmtToBePaid(val.SOL)) {
                        console.log(`You don't have enough balance in your wallet`);
                        return false;
                    } else {
                        console.log(`You will get ${getReturnAmount(val.SOL, parseFloat(val.RATIO))} if guessing the number correctly`)
                        return true;
                    }
                }
            },
        }
    ];
    return inquirer.prompt(questions);
};


const gameExecution = async () => {
    init();
    const generateRandomNumber = randomNumber(1, 5);
    //console.log("Generated number",generateRandomNumber);
    const answers = await askQuestions();
    if (answers.RANDOM) {
        const paymentSignature = await transferSOL(userWallet, treasuryWallet, totalAmtToBePaid(answers.SOL))
        console.log(`Signature of payment for playing the game`, `${paymentSignature}`);

        if (answers.RANDOM === generateRandomNumber) {
            // AirDrop Winning Amount

            await airDropSol(treasuryWallet, getReturnAmount(answers.SOL, parseFloat(answers.RATIO)));
            // guess is successfull

            const prizeSignature = await transferSOL(treasuryWallet, userWallet, getReturnAmount(answers.SOL, parseFloat(answers.RATIO)))

            console.log(`Your guess is correct`);
        } else {
            // better luck next time

            console.log(`Better luck next time`)
        }
    }
}

const airdropExecution = async () => {
    await airDropSol(userWallet, 100);
    const userBalance = await getWalletBalance(userWallet.publicKey.toString())
    console.log(userBalance);
}
airdropExecution()
gameExecution()



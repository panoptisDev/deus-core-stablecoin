// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
	// Hardhat always runs the compile task when running scripts with its command
	// line interface.
	//
	// If this script is run directly using `node` you may want to call compile 
	// manually to make sure everything is compiled
	// await hre.run('compile');

	// We get the contract to deploy

	const collateralAddress = "0x8313949568A16b2Cc786Af26F363071777Af4b8b"; //HUSD decimal: 6
	const creatorAddress = "0xB02648091da9e0AAcdd9F5cB9080C4893cad6C4E"; // DEUS 2
	const trustyAddress = "0xB02648091da9e0AAcdd9F5cB9080C4893cad6C4E"; // DEUS 2
	const HUSDPoolCeiling = 10000000000000;
	const minimumRequiredSignature = 1;


	// ORACLE
	const oracleContract = await hre.ethers.getContractFactory("Oracle");
	// address _admin, uint256 _minimumRequiredSignature, address _trusty_address
	const oracle = await oracleContract.deploy(creatorAddress, minimumRequiredSignature, trustyAddress);

	await oracle.deployed();

	console.log("ORACLE deployed to:", oracle.address);

	// DEI
	const deiContract = await hre.ethers.getContractFactory("DEIStableCoin");
	// string memory _name, string memory _symbol, address _creator_address, address _trusty_address
	const dei = await deiContract.deploy("Dei", "DEI", creatorAddress, trustyAddress);

	await dei.deployed();

	console.log("DEI deployed to:", dei.address);

	// DEUS
	const deusContract = await hre.ethers.getContractFactory("DEUSToken")
	// string memory _name, string memory _symbol, address _creator_address, address _trusty_address
	const deus = await deusContract.deploy("Deus", "DEUS", creatorAddress, trustyAddress); 

	await deus.deployed();

	console.log("DEUS deployed to:", deus.address);

	// DEI POOL Librariy
	const deiPoolLibraryContract = await hre.ethers.getContractFactory("DEIPoolLibrary")
	// empty
	const deiPoolLibrary = await deiPoolLibraryContract.deploy();               

	await deiPoolLibrary.deployed();

	console.log("DEI Pool Library deployed to:", deiPoolLibrary.address);

	// POOl HUSD
	const poolHUSDContract = await hre.ethers.getContractFactory("Pool_HUSD")
	// address _dei_contract_address, address _deus_contract_address, address _collateral_address, address _trusty_address, address _admin_address, uint256 _pool_ceiling, address _library
	const poolHUSD = await poolHUSDContract.deploy(dei.address, deus.address, collateralAddress, trustyAddress, creatorAddress, HUSDPoolCeiling, deiPoolLibrary.address);

	await poolHUSD.deployed();

	console.log("Pool HUSD deployed to:", poolHUSD.address);

	// Parameters
	dei.addPool(poolHUSD.address)
	dei.setOracle(oracle.address)
	dei.setDEIStep(10000)
	dei.setPriceTarget(1000000)
	dei.setRefreshCooldown(30)
	dei.setDEUSAddress(deus.address)
	dei.setPriceBand(5000)

	deus.setDEIAddress(dei.address)
	
	// uint256 new_ceiling, uint256 new_bonus_rate, uint256 new_redemption_delay, uint256 new_mint_fee, uint256 new_redeem_fee, uint256 new_buyback_fee, uint256 new_recollat_fee
	poolHUSD.setPoolParameters(HUSDPoolCeiling, 0, 1, 1000, 1000, 1000, 1000)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});

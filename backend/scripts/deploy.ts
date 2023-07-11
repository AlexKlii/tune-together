import { ethers } from 'hardhat'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { CampaignFactory, TuneTogether } from '../typechain-types'

async function main() {
  const [owner]: HardhatEthersSigner[] = await ethers.getSigners()

  /* ****************************************************************** */
  /* **********           Deploy CampaignFactory           ************* */
  /* ****************************************************************** */
  const CampaignFactory = await ethers.getContractFactory('CampaignFactory')
  const campaignFactory: CampaignFactory = await CampaignFactory.connect(owner).deploy()

  await campaignFactory.waitForDeployment()
  const campaignFactoryAddress = await campaignFactory.getAddress()

  console.log(`CampaignFactory deployed to ${campaignFactoryAddress}`)


  /* ****************************************************************** */
  /* **********            Deploy TuneTogether            ************* */
  /* ****************************************************************** */
  const TuneTogether = await ethers.getContractFactory('TuneTogether')
  const tuneTogether: TuneTogether = await TuneTogether.connect(owner).deploy(campaignFactoryAddress)

  await tuneTogether.waitForDeployment()
  const tuneTogetherAddress = await tuneTogether.getAddress()

  console.log(`TuneTogether deployed to ${tuneTogetherAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
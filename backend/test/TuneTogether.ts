import { CampaignFactory, TuneTogether } from '../typechain-types'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { artistName, baseUri, bio, description, fees, campaignName, nbTiers } from './constants'
import { TuneTogetherFixture } from './interfaces'

describe('TuneTogether', () => {
  async function deployFixture(): Promise<TuneTogetherFixture> {
    const [owner, artist]: HardhatEthersSigner[] = await ethers.getSigners()

    const CampaignFactory = await ethers.getContractFactory('CampaignFactory')
    const campaignFactory: CampaignFactory = await CampaignFactory.connect(owner).deploy()

    const TuneTogether = await ethers.getContractFactory('TuneTogether')
    const campaignFactoryAddr = await campaignFactory.getAddress()

    const tuneTogether: TuneTogether = await TuneTogether.connect(owner).deploy(campaignFactoryAddr)
    const tuneTogetherAddr: string = await tuneTogether.getAddress()
    await campaignFactory.setOwnerContractAddr(tuneTogetherAddr)

    return { tuneTogether, campaignFactory, owner, artist }
  }

  describe('Deployment', () => {
    it('isArtist should be false', async () => {
      const { tuneTogether, artist } = await loadFixture(deployFixture)
      expect(await tuneTogether.isArtist(artist.address)).to.be.equal(false)
    })
  })

  describe('Create a new CrowdfundingCampaign', () => {
    it('Should emit CrowdfundingCampaignCreated', async () => {
      const { tuneTogether, campaignFactory } = await loadFixture(deployFixture)
      // Create campaign with 0% fees
      await expect(tuneTogether.createNewCampaign(
        campaignName,
        description,
        0,
        artistName,
        bio,
        baseUri,
        nbTiers
      )).to.emit(tuneTogether, 'CampaignAdded')

      // Create campaign with 5% fees
      await expect(tuneTogether.createNewCampaign(
        campaignName,
        description,
        5,
        artistName,
        bio,
        baseUri,
        nbTiers
      )).to.emit(tuneTogether, 'CampaignAdded')

      // Create campaign with 10% fees
      await expect(tuneTogether.createNewCampaign(
        campaignName,
        description,
        10,
        artistName,
        bio,
        baseUri,
        nbTiers
      )).to.emit(tuneTogether, 'CampaignAdded')
    })

    it('Should emit ArtistCreated', async () => {
      const { tuneTogether, artist } = await loadFixture(deployFixture)
      await expect(tuneTogether.connect(artist).createNewCampaign(
        campaignName,
        description,
        fees,
        artistName,
        bio,
        baseUri,
        nbTiers
      )).to.emit(tuneTogether, 'ArtistCreated').withArgs(artist.address)
    })

    it('Should get Artist', async () => {
      const { tuneTogether, artist } = await loadFixture(deployFixture)
      await tuneTogether.connect(artist).createNewCampaign(
        campaignName,
        description,
        fees,
        artistName,
        bio,
        baseUri,
        nbTiers
      )

      expect(await tuneTogether.isArtist(artist.address)).to.be.equal(true)
      expect(await tuneTogether.getArtist(artist.address)).to.deep.equal([
        artistName,
        bio,
        fees.toString()
      ])
    })

    it('Should get one campaign', async () => {
      const { tuneTogether, artist } = await loadFixture(deployFixture)

      const tx = await tuneTogether.connect(artist).createNewCampaign(
        campaignName,
        description,
        0,
        artistName,
        bio,
        baseUri,
        nbTiers
      )

      const result = await tx.wait()

      // Get the CampaignAdded event log by is index
      const eventLog: any = result?.logs.find((log) => log.index == 2)
      if (eventLog && eventLog.fragment.name == 'CampaignAdded') {
        // Retrieve the campaign address created
        const contractAddress: string = eventLog.args[1]
        
        expect(await tuneTogether.getOneCampaign(contractAddress)).to.deep.equal([
          campaignName,
          description,
          fees.toString(),
          nbTiers,
          artist.address
        ])
      }
    })

    it('Revert if campaign name too short', async () => {
      const { tuneTogether } = await loadFixture(deployFixture)

      await expect(tuneTogether.createNewCampaign(
        'S',
        description,
        fees,
        artistName,
        bio,
        baseUri,
        nbTiers
      )).to.be.revertedWith('Campaign name too short')
    })

    it('Revert if campaign name too long', async () => {
      const { tuneTogether } = await loadFixture(deployFixture)

      await expect(tuneTogether.createNewCampaign(
        'This Campaign name is really long',
        description,
        fees,
        artistName,
        bio,
        baseUri,
        nbTiers
      )).to.be.revertedWith('Campaign name too long')
    })

    it('Revert if description too short', async () => {
      const { tuneTogether } = await loadFixture(deployFixture)

      await expect(tuneTogether.createNewCampaign(
        campaignName,
        'S',
        fees,
        artistName,
        bio,
        baseUri,
        nbTiers
      )).to.be.revertedWith('Campaign description too short')
    })

    it('Revert if wrong fees', async () => {
      const { tuneTogether } = await loadFixture(deployFixture)

      await expect(tuneTogether.createNewCampaign(
        campaignName,
        description,
        42,
        artistName,
        bio,
        baseUri,
        nbTiers
      )).to.be.revertedWith('Wrong fees')
    })
    
    it('Revert if artist name too short', async () => {
      const { tuneTogether } = await loadFixture(deployFixture)

      await expect(tuneTogether.createNewCampaign(
        campaignName,
        description,
        fees,
        'S',
        bio,
        baseUri,
        nbTiers
      )).to.be.revertedWith('Artist name too short')
    })

    it('Revert if artist name too long', async () => {
      const { tuneTogether } = await loadFixture(deployFixture)

      await expect(tuneTogether.createNewCampaign(
        campaignName,
        description,
        fees,
        'This Artist name is really long',
        bio,
        baseUri,
        nbTiers
      )).to.be.revertedWith('Artist name too long')
    })

    it('Revert if artist bio too short', async () => {
      const { tuneTogether } = await loadFixture(deployFixture)

      await expect(tuneTogether.createNewCampaign(
        campaignName,
        description,
        fees,
        artistName,
        'S',
        baseUri,
        nbTiers
      )).to.be.revertedWith('Artist bio too short')
    })

    it('Should not enter an existing Artist', async () => {
      const { tuneTogether, artist } = await loadFixture(deployFixture)
      await tuneTogether.connect(artist).createNewCampaign(
        campaignName,
        description,
        fees,
        artistName,
        bio,
        baseUri,
        nbTiers
      )

      await expect(await tuneTogether.connect(artist).createNewCampaign(
        'Another campaign',
        'Campaign with existing artist',
        fees,
        artistName,
        bio,
        baseUri,
        nbTiers
      )).to.not.emit(tuneTogether, 'ArtistCreated')
    })

    it('Revert if not enough tiers', async () => {
      const { tuneTogether } = await loadFixture(deployFixture)
  
      await expect(tuneTogether.createNewCampaign(
        campaignName,
        description,
        fees,
        artistName,
        bio,
        baseUri,
        0
      )).to.be.revertedWith('Not enough tier prices')
    })
  
    it('Revert if not enough tiers', async () => {
      const { tuneTogether } = await loadFixture(deployFixture)
  
      await expect(tuneTogether.createNewCampaign(
        campaignName,
        description,
        fees,
        artistName,
        bio,
        baseUri,
        42
      )).to.be.revertedWith('Too many tier prices')
    })
  })

  describe('Update Campaign Informations', () => {
    it('Should update campaign informations', async () => {
      const { tuneTogether, artist } = await loadFixture(deployFixture)

      const tx = await tuneTogether.connect(artist).createNewCampaign(
        campaignName,
        description,
        0,
        artistName,
        bio,
        baseUri,
        nbTiers
      )

      const result = await tx.wait();

      // Get the CampaignAdded event log by is index
      const eventLog: any = result?.logs.find((log) => log.index == 2)
      if (eventLog && eventLog.fragment.name == 'CampaignAdded') {
        // Retrieve the campaign address created
        const contractAddress: string = eventLog.args[1]
        
        await expect(tuneTogether.connect(artist).updateCampaignInfo(
          'new name',
          'Update campaign with 0% fees',
          0,
          contractAddress
        )).to.emit(tuneTogether, 'CampaignUpdated').withArgs(contractAddress)

        await expect(tuneTogether.connect(artist).updateCampaignInfo(
          'new name',
          'Update campaign with 5% fees',
          5,
          contractAddress
        )).to.emit(tuneTogether, 'CampaignUpdated').withArgs(contractAddress)

        await expect(tuneTogether.connect(artist).updateCampaignInfo(
          'new name',
          'Update campaign with 10% fees',
          10,
          contractAddress
        )).to.emit(tuneTogether, 'CampaignUpdated').withArgs(contractAddress)
      }
    })

    it('Revert not the campaign artist', async () => {
      const { tuneTogether, artist, owner } = await loadFixture(deployFixture)

      const tx = await tuneTogether.connect(artist).createNewCampaign(
        campaignName,
        description,
        0,
        artistName,
        bio,
        baseUri,
        nbTiers
      )

      const result = await tx.wait()

      // Get the CampaignAdded event log by is index
      const eventLog: any = result?.logs.find((log) => log.index == 2)
      if (eventLog && eventLog.fragment.name == 'CampaignAdded') {
        // Retrieve the campaign address created
        const contractAddress: string = eventLog.args[1]
        
        await expect(tuneTogether.connect(owner).updateCampaignInfo(
          campaignName,
          description,
          0,
          contractAddress
        )).to.be.revertedWith('You\'re not the campaign artist')
      }
    })

    it('Revert if name too short', async () => {
      const { tuneTogether, artist } = await loadFixture(deployFixture)

      const tx = await tuneTogether.connect(artist).createNewCampaign(
        campaignName,
        description,
        0,
        artistName,
        bio,
        baseUri,
        nbTiers
      )

      const result = await tx.wait()

      // Get the CampaignAdded event log by is index
      const eventLog: any = result?.logs.find((log) => log.index == 2)
      if (eventLog && eventLog.fragment.name == 'CampaignAdded') {
        // Retrieve the campaign address created
        const contractAddress: string = eventLog.args[1]
        
        await expect(tuneTogether.connect(artist).updateCampaignInfo(
          'S',
          description,
          0,
          contractAddress
        )).to.be.revertedWith('Name too short')
      }
    })

    it('Revert if name too long', async () => {
      const { tuneTogether, artist } = await loadFixture(deployFixture)

      const tx = await tuneTogether.connect(artist).createNewCampaign(
        campaignName,
        description,
        0,
        artistName,
        bio,
        baseUri,
        nbTiers
      )

      const result = await tx.wait()

      // Get the CampaignAdded event log by is index
      const eventLog: any = result?.logs.find((log) => log.index == 2)
      if (eventLog && eventLog.fragment.name == 'CampaignAdded') {
        // Retrieve the campaign address created
        const contractAddress: string = eventLog.args[1]
        
        await expect(tuneTogether.connect(artist).updateCampaignInfo(
          'This Campaign name is really long',
          description,
          0,
          contractAddress
        )).to.be.revertedWith('Name too long')
      }
    })

    it('Revert if description too short', async () => {
      const { tuneTogether, artist } = await loadFixture(deployFixture)

      const tx = await tuneTogether.connect(artist).createNewCampaign(
        campaignName,
        description,
        0,
        artistName,
        bio,
        baseUri,
        nbTiers
      )

      const result = await tx.wait()

      // Get the CampaignAdded event log by is index
      const eventLog: any = result?.logs.find((log) => log.index == 2)
      if (eventLog && eventLog.fragment.name == 'CampaignAdded') {
        // Retrieve the campaign address created
        const contractAddress: string = eventLog.args[1]
        
        await expect(tuneTogether.connect(artist).updateCampaignInfo(
          campaignName,
          'S',
          0,
          contractAddress
        )).to.be.revertedWith('Description too short')
      }
    })

    it('Revert if wrong fees', async () => {
      const { tuneTogether, artist } = await loadFixture(deployFixture)

      const tx = await tuneTogether.connect(artist).createNewCampaign(
        campaignName,
        description,
        0,
        artistName,
        bio,
        baseUri,
        nbTiers
      )

      const result = await tx.wait()

      // Get the CampaignAdded event log by is index
      const eventLog: any = result?.logs.find((log) => log.index == 2)
      if (eventLog && eventLog.fragment.name == 'CampaignAdded') {
        // Retrieve the campaign address created
        const contractAddress: string = eventLog.args[1]
        
        await expect(tuneTogether.connect(artist).updateCampaignInfo(
          campaignName,
          description,
          42,
          contractAddress
        )).to.be.revertedWith('Wrong fees option')
      }
    })
  })
})
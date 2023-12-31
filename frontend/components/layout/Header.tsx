'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Link } from '@chakra-ui/react'

import NextLink from 'next/link'
import AppLogo from '../AppLogo'
import { useAccount, useContractEvent } from 'wagmi'
import { useEffect, useState } from 'react'
import { userIsArtist } from '@/utils'
import { contractAddress, tuneTogetherAbi } from '@/constants'

const Header = () => {
    const { address, isConnected } = useAccount()
    const [isArtist, setIsArtist] = useState(false)
    const [artistCreated, setArtistCreated] = useState<`0x${string}`>()

    useContractEvent({
        address: contractAddress,
        abi: tuneTogetherAbi,
        eventName: 'ArtistCreated',
        listener(log: any) {
            setArtistCreated(log[0].args._artistAddr)
        }
    })

    useEffect(() => {
        userIsArtist(address as `0x${string}`).then(isArtist => setIsArtist(isArtist))
    }, [isConnected, address, artistCreated])

    return (
        <header className='bg-gray-950 text-gray-100 border-gray-500 border-b'>
            <nav className='mx-auto flex justify-between text-center py-5'>
                <div className='pt-1 w-1/6'>
                    <AppLogo textSize='text-xl' pbSize='pb-0'/>
                </div>

                <div className={`flex justify-start ${isConnected ? 'w-3/6' : 'w-4/6'}`}>
                    {isConnected && <>
                        <Link as={NextLink} href='/campaigns' className='rounded-lg px-5 py-2 font-medium hover:bg-gray-800 hover:text-slate-300' style={{ textDecoration: 'none' }}>
                            Search a Campaign
                        </Link>

                        <Link as={NextLink} href='/campaigns/create-campaign' className='rounded-lg px-5 py-2 font-medium hover:bg-gray-800 hover:text-slate-300' style={{ textDecoration: 'none' }}>
                            Start a Campaign
                        </Link>

                        {isArtist && 
                            <Link as={NextLink} href='/artist/campaigns' className='rounded-lg px-10 py-2 font-medium hover:bg-gray-800 hover:text-slate-300' style={{ textDecoration: 'none' }}>
                                My Campaigns
                            </Link>
                        }
                    </>}
                </div>

                {isConnected &&
                    <div className='w-2/6'>
                        <ConnectButton />
                    </div>
                }
            </nav>
        </header>
    )
}
export default Header
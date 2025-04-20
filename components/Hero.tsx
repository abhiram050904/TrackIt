"use client"
import Link from 'next/link'
import React, { useEffect, useRef } from 'react'
import { Button } from './ui/button'
import Image from 'next/image'
import img1 from '../public/banner.jpg'
const Hero = () => {
    const imageRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const imageElement = imageRef.current;
    
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            const scrollThreshold = 100;
    
            if (scrollPosition > scrollThreshold) {
                imageElement?.classList.add("scrolled");
            } else {
                imageElement?.classList.remove("scrolled"); // Remove the class when scrolling above the threshold
            }
        };
    
        window.addEventListener("scroll", handleScroll);
    
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    
  return (
    <div className='pb-20 px-4'>
      <div className='container  mx-auto text-center'>
        <h1 className='text-5xl md:text-8xl lg:text-[105px] pb-6 gradient-title'>Manage  Your Expenses <br/> with TrackIt</h1>
        <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>AI-powered finance tracking. Smarter money moves, effortlessly.
        Let TrackIt’s intelligent engine analyze your spending, optimize your budget, and guide your financial journey </p>

        <div className='flex justify-center space-x-4'>
            <Link href={"/dashboard"}>
            <Button size={"lg"} className='px-8'>Get Started</Button>
            </Link>
            <Link href={"/dashboard"}>
            <Button size={"lg"} variant={"outline"} className='px-8'>Watch demo</Button>
            </Link>
        </div>
        <div className='hero-image-wrapper'>
            <div className='hero-image' ref={imageRef}>
                <Image src={img1} alt='banner' width={1280} height={720} className='rounded-lg shadow-2xl border mx-auto' priority/>
            </div>
        </div>
      </div>
    </div>
  )
}

export default Hero

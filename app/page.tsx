'use client'

import { FC, useEffect, useState } from 'react'
import { UseDraw } from '../hooks/useDraw'
import { ChromePicker } from 'react-color'
import { io } from 'socket.io-client'
import { DrawLine } from '../utils/drawLine'

const socket = io('https://teste-3-server.onrender.com')


interface pageProps{}

type DrawLineProps = {
  prevPoint: Point | null
  currentPoint: Point
  color: string
}

const Page: FC<pageProps> = ({}) => {
  const [color, setColor] = useState<string>('#000')
  const { canvasRef, onMouseDown, clear } = UseDraw(createLine)



  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')

    socket.emit('client-ready')

    socket.on('get-canvas-state', () => {
      if (!canvasRef.current?.toDataURL()) return
      socket.emit('canvas-state', canvasRef.current.toDataURL())
    })

    socket.on('canvas-state-from-server', (state: string) => {
      console.log('Eu recebi o estado')
      const img = new Image()
      img.src = state
      img.onload = () => {
        ctx?.drawImage(img, 0, 0)
      }
    })

    socket.on('draw-line', ({ prevPoint, currentPoint, color }: DrawLineProps) => {
      if (!ctx) return
      DrawLine({ prevPoint, currentPoint, ctx, color })
    })
    socket.on('clear', clear)

    return () => {
      socket.off('get-canvas-state')
      socket.off('canvas-state-from-server')
      socket.off('draw-line')
      socket.off('clear')
    }

    
  }, [canvasRef])


  function createLine({ prevPoint, currentPoint, ctx }: Draw){
    socket.emit('draw-line', ({ prevPoint, currentPoint, color }))
    DrawLine({ prevPoint, currentPoint, ctx, color })
  }

  return (
    <div className='w-screen h-screen bg-white flex justify-center items-center'>
      <div className='flex flex-col gap-10 pr-10'>
        <ChromePicker color={color} onChange={(e) => setColor(e.hex)} />
        <button type='button' className="p-2 rounded-md border border-black" onClick={() => socket.emit('clear')}>Clear canvas</button>
      </div>
      <canvas onMouseDown={onMouseDown} ref={canvasRef} width={750} height={750} className='border border-black rounded-md' />
    </div>
  )
}

export default Page;

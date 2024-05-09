'use client';
import React from 'react'

type ButtonProps = {
  onClick: () => void;
  name: string
}

const Button: React.FC<ButtonProps> = ({onClick, name}) => {
  return (
    <button onClick={onClick}>{name}</button>
  )
}

export default Button;

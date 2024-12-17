import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const svg = readFileSync('media/icon.svg')
sharp(svg)
  .png()
  .resize(128, 128)
  .toFile('media/icon.png')

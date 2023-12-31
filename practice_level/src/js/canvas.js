/*
 * @Author: Hamletbat 1125051234@qq.com
 * @Date: 2023-04-07 20:42:53
 * @LastEditors: heycheesecheese xrenlab2023@gmail.com
 * @LastEditTime: 2023-06-01 16:16:21
 * @FilePath: \CHEC_Advanture_server\src\js\canvas.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import gsap from 'gsap'
import {
  createImage,
  createImageAsync,
  isOnTopOfPlatform,
  hitBottomOfPlatform,
  hitSideOfPlatform,
  objectsTouch,
  objectsSideTouch
} from './utils.js'

import platform from '../img/level1/platform.png'
import hillsClouds from '../img/level1/hillsClouds.png'
import background from '../img/level1/background.png'
import platformSmallTall from '../img/level1/platformSmallTall.png'
import block from '../img/level1/block.png'
import blockTri from '../img/level1/blockTri.png'
import block2 from '../img/level1/block2.png'
import block3 from '../img/level1/block3.png'
import block4 from '../img/level1/block4.png'
import block5 from '../img/level1/block5.png'
import block6 from '../img/level1/block6.png'
import mdPlatform from '../img/level1/mdPlatform.png'
import lgPlatform from '../img/level1/lgPlatform.png'
import flyingPlatform from '../img/level1/flyingPlatform.png'
import tPlatform from '../img/level1/tPlatform.png'
import xtPlatform from '../img/level1/xtPlatform.png'
import flagPoleSprite from '../img/level1/flagPole.png'

import spriteRunLeft from '../img/level1/spriteRunLeft.png'
import spriteRunRight from '../img/level1/spriteRunRight.png'
import spriteStandLeft from '../img/level1/spriteStandLeft.png'
import spriteStandRight from '../img/level1/spriteStandRight.png'
import spriteJumpRight from '../img/level1/spriteJumpRight.png'
import spriteJumpLeft from '../img/level1/spriteJumpLeft.png'
import { audio } from './audio.js'
import { images } from './images.js'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

let gravity = 0.78

class Player {
  constructor() {
    this.speed = 4.2
    this.position = {
      x: 400,
      y: 100
    }
    this.velocity = {
      x: 0,
      y: 0
    }

    this.scale = 0.08
    this.width = 500 * this.scale
    this.height = 500 * this.scale

    this.image = createImage(spriteStandRight)
    this.frames = 0
    this.sprites = {
      stand: {
        right: createImage(spriteStandRight),
        left: createImage(spriteStandLeft),
      },
      run: {
        right: createImage(spriteRunRight),
        left: createImage(spriteRunLeft),
      },
      jump: {
        right: createImage(spriteJumpRight),
        left: createImage(spriteJumpLeft),
      }
    }

    this.currentSprite = this.sprites.stand.right
    this.currentCropWidth = 500
    this.invincible = false
    this.opacity = 1
  }

  draw() {
    c.save()
    c.globalAlpha = this.opacity
    //c.fillStyle = 'rgba(255, 0, 0, .2)'
    //c.fillRect(this.position.x, this.position.y, this.width, this.height)
    c.drawImage(
      this.currentSprite,
      this.currentCropWidth * this.frames,
      0,
      this.currentCropWidth,
      500,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    )
    c.restore()
  }

  update() {
    this.frames++
    const { currentSprite, sprites } = this

    if (
      this.frames > 25 &&
      (currentSprite === sprites.stand.right ||
        currentSprite === sprites.stand.left)
    )
      this.frames = 0
    else if (
      this.frames > 11 &&
      (currentSprite === sprites.run.right ||
        currentSprite === sprites.run.left)
    )
      this.frames = 0
    else if (currentSprite === sprites.jump.right ||
    currentSprite === sprites.jump.left)
      this.frames = 0

    this.draw()
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    if (this.position.y + this.height + this.velocity.y <= canvas.height)
      this.velocity.y += gravity

    if (this.invincible) {
      if (this.opacity === 1) this.opacity = 0
      else this.opacity = 1
    } else this.opacity = 1
  }
}

class Platform {
  constructor({ x, y, image, block, text }) {
    this.position = {
      x,
      y
    }

    this.velocity = {
      x: 0
    }
    this.image = image
    this.width = image.width
    this.height = image.height
    this.block = block
    this.text = text
  }

  draw() {
    c.drawImage(this.image, this.position.x, this.position.y)

    if (this.text) {
      c.font = '20px Arial'
      c.fillStyle = 'red'
      c.fillText(this.text, this.position.x, this.position.y)
    }
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
  }
}

class GenericObject {
  constructor({ x, y, image }) {
    this.position = {
      x,
      y
    }

    this.velocity = {
      x: 0
    }

    this.image = image
    this.scale = 0.5
    this.width = image.width * this.scale
    this.height = image.height * this.scale
  }

  draw() {
    c.drawImage(this.image, this.position.x, this.position.y)
  }

  update() {
    this.draw()
    this.position.x += this.velocity.x
  }
}


let platformImage
let platformSmallTallImage
let blockTriImage
let lgPlatformImage
let tPlatformImage
let xtPlatformImage
let flyingPlatformImage
let blockImage
let block2Image
let block3Image
let block4Image
let block5Image
let block6Image

let player = new Player()
let platforms = []
let genericObjects = []
let cockroachs = []
let particles = []
let fireFlowers = []
let jumpCount = 0

let lastKey
let keys
let isJumping = 0

let scrollOffset
let flagPole
let flagPoleImage
let game
let currentLevel = 1

function selectLevel(currentLevel) {
  if (!audio.musicLevel1.playing()) audio.musicLevel1.play() //检查音乐是否正在播放
  switch (currentLevel) {
    case 1:
      init()
      break
    case 2:
      initLevel2()
      break
    case 3:
      initLevel3()
      break
  }
}

async function init() {
  player = new Player()
  keys = {
    right: {
      pressed: false
    },
    left: {
      pressed: false
    }
  }
  scrollOffset = 0

  game = {
    disableUserInput: false
  }

  platformImage = await createImageAsync(platform)
  platformSmallTallImage = await createImageAsync(platformSmallTall)
  blockTriImage = await createImageAsync(blockTri)
  blockImage = await createImageAsync(block)
  block2Image = await createImageAsync(block2)
  block3Image = await createImageAsync(block3)
  block4Image = await createImageAsync(block4)
  block5Image = await createImageAsync(block5)
  block6Image = await createImageAsync(block6)
  lgPlatformImage = await createImageAsync(lgPlatform)
  flyingPlatformImage = await createImageAsync(flyingPlatform)
  tPlatformImage = await createImageAsync(tPlatform)
  xtPlatformImage = await createImageAsync(xtPlatform)
  flagPoleImage = await createImageAsync(flagPoleSprite)

  flagPole = new GenericObject({
    x: 15.5*canvas.width,
    y: canvas.height - lgPlatformImage.height - flagPoleImage.height,
    image: flagPoleImage
  })


  /* fireFlowers = [
    new FireFlower({
      position: {
        x: 400,
        y: 100
      },
      velocity: {
        x: 0,
        y: 0
      }
    })
  ] */
  
  player = new Player()
  const cockcroachWidth = 43.33
  cockroachs = []
  particles = []
  platforms = [
    new Platform({
      x: 0.2*canvas.width,
      y: canvas.height-lgPlatformImage.height-block6Image.height,
      image: block6Image,
      block: true
    }),
    //1-1
    new Platform({
      x: 0.5*canvas.width + 274/2,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: tPlatformImage,
      block: true
    }),
    new Platform({
      x: 1.5*canvas.width + 274/2 + tPlatformImage.width + 150,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: tPlatformImage,
      block: true
    }),
    new Platform({
      x: 1.5*canvas.width + 274/2 + 2*tPlatformImage.width + 2*150,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: xtPlatformImage,
      block: true
    }),
    // 1-2
    new Platform({
      x: 0.5*canvas.width + 248/2,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: tPlatformImage,
      block: true
    }),
    new Platform({
      x: 0.5*canvas.width + 248/2 + tPlatformImage.width + 50,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height - 150,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 0.5*canvas.width + 248/2 + tPlatformImage.width + blockImage.width + 200,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height - 150,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 0.5*canvas.width + 248/2 + tPlatformImage.width + 2*blockImage.width + 275,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height - 150,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 0.5*canvas.width + 248/2 + tPlatformImage.width + 3*blockImage.width + 400,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height - 150,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 0.5*canvas.width + 248/2 + tPlatformImage.width + 4*blockImage.width + 500,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: xtPlatformImage,
      block: true
    }),
    new Platform({
      x: 0.5*canvas.width + 248/2 + 2*tPlatformImage.width + 4*blockImage.width + 600,
      y: canvas.height - lgPlatformImage.height - block3Image.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 0.5*canvas.width + 248/2 + 2*tPlatformImage.width + 5*blockImage.width + 725,
      y: canvas.height - lgPlatformImage.height - block5Image.height,
      image: blockImage,
      block: true
    }),
    //1-3
    new Platform({
      x: 2.5*canvas.width + 50,
      y: canvas.height-lgPlatformImage.height-block5Image.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 2.5*canvas.width + 448/2,
      y: canvas.height-lgPlatformImage.height-block3Image.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 2.5*canvas.width + 448/2 + 5*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block6Image.height,
      image: block6Image,
      block: true
    }),
  ]
  genericObjects = [
    new GenericObject({
      x: -5,
      y: -5,
      image: createImage(background)
    }),
    /*new GenericObject({
      x: 0,
      y: 30,
      image: createImage(hillsClouds)
    })*/ 
  ]

  scrollOffset = 0

  const platformsMap = [
    'lg',
    'lg',
    'lg',
    'lg',
    'lg',
    'lg',
    'lg',
    'lg',
    'lg'
  ]

  let platformDistance = 0

  platformsMap.forEach((symbol) => {
    switch (symbol) {
      case 'lg':
        platforms.push(
          new Platform({
            x: platformDistance,
            y: canvas.height - lgPlatformImage.height,
            image: lgPlatformImage,
            block: true,
            //text: platformDistance
          })
        )

        platformDistance += lgPlatformImage.width - 2

        break

      case 'gap':
        platformDistance += 175

        break

      case 't':
        platforms.push(
          new Platform({
            x: platformDistance,
            y: canvas.height - tPlatformImage.height,
            image: tPlatformImage,
            block: true
          })
        )

        platformDistance += tPlatformImage.width - 2

        break

      case 'xt':
        platforms.push(
          new Platform({
            x: platformDistance,
            y: canvas.height - xtPlatformImage.height,
            image: xtPlatformImage,
            block: true,
            text: platformDistance
          })
        )

        platformDistance += xtPlatformImage.width - 2

        break
    }
  })
}

async function initLevel2() {
  player = new Player()
  keys = {
    right: {
      pressed: false
    },
    left: {
      pressed: false
    }
  }
  scrollOffset = 0

  game = {
    disableUserInput: false
  }

  platformImage = await createImageAsync(platform)
  platformSmallTallImage = await createImageAsync(platformSmallTall)
  blockTriImage = await createImageAsync(blockTri)
  blockImage = await createImageAsync(block)
  block2Image = await createImageAsync(block2)
  block3Image = await createImageAsync(block3)
  block4Image = await createImageAsync(block4)
  block5Image = await createImageAsync(block5)
  block6Image = await createImageAsync(block6)
  lgPlatformImage = await createImageAsync(lgPlatform)
  flyingPlatformImage = await createImageAsync(flyingPlatform)
  tPlatformImage = await createImageAsync(tPlatform)
  xtPlatformImage = await createImageAsync(xtPlatform)
  flagPoleImage = await createImageAsync(flagPoleSprite)

  flagPole = new GenericObject({
    x: 15.5*canvas.width,
    y: canvas.height - lgPlatformImage.height - flagPoleImage.height,
    image: flagPoleImage
  })


  /* fireFlowers = [
    new FireFlower({
      position: {
        x: 400,
        y: 100
      },
      velocity: {
        x: 0,
        y: 0
      }
    })
  ] */
  
  player = new Player()
  const cockcroachWidth = 43.33
  cockroachs = []
  particles = []
  platforms = [
    //1-1
    new Platform({
      x: 0.5*canvas.width + 274/2,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: tPlatformImage,
      block: true
    }),
    new Platform({
      x: 0.5*canvas.width + 274/2 + tPlatformImage.width + 150,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: tPlatformImage,
      block: true
    }),
    new Platform({
      x: 0.5*canvas.width + 274/2 + 2*tPlatformImage.width + 2*150,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: xtPlatformImage,
      block: true
    }),
    // 1-2
    // 第一列
    new Platform({
      x: 1.5*canvas.width + 98/2,
      y: canvas.height-lgPlatformImage.height-blockImage.height,
      image: blockImage,
      block: true
    }),
    // 第二列
    new Platform({
      x: 1.5*canvas.width + 98/2 + blockImage.width,
      y: canvas.height-lgPlatformImage.height-block2Image.height,
      image: block2Image,
      block: true
    }),
    // 第三列
    new Platform({
      x: 1.5*canvas.width + 98/2 + 2*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block3Image.height,
      image: block3Image,
      block: true
    }),
    // 第四列
    new Platform({
      x: 1.5*canvas.width + 98/2 + 3*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block4Image.height,
      image: block4Image,
      block: true
    }),
    // 第五列
    new Platform({
      x: 1.5*canvas.width + 98/2 + 4*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block5Image.height,
      image: block5Image,
      block: true
    }),
    // 第六列
    new Platform({
      x: 1.5*canvas.width + 98/2 + 5*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block6Image.height,
      image: block6Image,
      block: true
    }),
    //flyingplatform1
    new Platform({
      x: 1.5*canvas.width + 98/2 + 6*blockImage.width + 150,
      y: canvas.height-lgPlatformImage.height-6*blockImage.height,
      image: flyingPlatformImage,
      block: true,
    }),
    new Platform({
      x: 1.5*canvas.width + 98/2 + 6*blockImage.width + flyingPlatformImage.width + 2*150,
      y: canvas.height-lgPlatformImage.height-6*blockImage.height,
      image: flyingPlatformImage,
      block: true
    }),
    //block6
    new Platform({
      x: 1.5*canvas.width + 98/2 + 6*blockImage.width + 2*flyingPlatformImage.width + 3*150,
      y: canvas.height-lgPlatformImage.height-block6Image.height,
      image: block6Image,
      block: true
    }),
    //flyingplatform2
    new Platform({
      x: 1.5*canvas.width + 98/2 + 6*blockImage.width + 2*flyingPlatformImage.width + block6Image.width + 4*150,
      y: canvas.height-lgPlatformImage.height-6*blockImage.height,
      image: flyingPlatformImage,
      block: true
    }),
    new Platform({
      x: 1.5*canvas.width + 98/2 + 6*blockImage.width + 3*flyingPlatformImage.width + block6Image.width + 5*150,
      y: canvas.height-lgPlatformImage.height-6*blockImage.height,
      image: flyingPlatformImage,
      block: true
    }),
    //block 654321
    new Platform({
      x: 1.5*canvas.width + 98/2 + 6*blockImage.width + 4*flyingPlatformImage.width + block6Image.width + 6*150,
      y: canvas.height-lgPlatformImage.height-block6Image.height,
      image: block6Image,
      block: true
    }),
    new Platform({
      x: 1.5*canvas.width + 98/2 + 7*blockImage.width + 4*flyingPlatformImage.width + block6Image.width + 6*150,
      y: canvas.height-lgPlatformImage.height-block5Image.height,
      image: block5Image,
      block: true
    }),
    new Platform({
      x: 1.5*canvas.width + 98/2 + 8*blockImage.width + 4*flyingPlatformImage.width + block6Image.width + 6*150,
      y: canvas.height-lgPlatformImage.height-block4Image.height,
      image: block4Image,
      block: true
    }),
    new Platform({
      x: 1.5*canvas.width + 98/2 + 9*blockImage.width + 4*flyingPlatformImage.width + block6Image.width + 6*150,
      y: canvas.height-lgPlatformImage.height-block3Image.height,
      image: block3Image,
      block: true
    }),
    new Platform({
      x: 1.5*canvas.width + 98/2 + 10*blockImage.width + 4*flyingPlatformImage.width + block6Image.width + 6*150,
      y: canvas.height-lgPlatformImage.height-block2Image.height,
      image: block2Image,
      block: true
    }),
    new Platform({
      x: 1.5*canvas.width + 98/2 + 11*blockImage.width + 4*flyingPlatformImage.width + block6Image.width + 6*150,
      y: canvas.height-lgPlatformImage.height-blockImage.height,
      image: blockImage,
      block: true
    }),
    //1-3
    new Platform({
      x: 3.5*canvas.width + 148/2 + 200,
      y: canvas.height-lgPlatformImage.height-tPlatformImage.height,
      image: blockTriImage,
      block: true
    }),
    new Platform({
      x: 3.5*canvas.width + 148/2 + 200 + blockTriImage.width + 100,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: tPlatformImage,
      block: true
    }),
    new Platform({
      x: 3.5*canvas.width + 148/2 + 2*200 + blockTriImage.width + tPlatformImage.width + 100,
      y: canvas.height-lgPlatformImage.height-tPlatformImage.height,
      image: blockTriImage,
      block: true
    }),
    new Platform({
      x: 3.5*canvas.width + 148/2 + 2*200 + 2*blockTriImage.width + tPlatformImage.width + 2*100,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: xtPlatformImage,
      block: true
    }),
    new Platform({
      x: 3.5*canvas.width + 148/2 + 3*200 + 2*blockTriImage.width + 2*tPlatformImage.width + 2*100 + 2/3*blockTriImage.width,
      y: canvas.height-lgPlatformImage.height-tPlatformImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 3.5*canvas.width + 148/2 + 3*200 + 3*blockTriImage.width + 2*tPlatformImage.width + 3*100,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: xtPlatformImage,
      block: true
    }),
    //1-4
    new Platform({
      x: 5.5*canvas.width + 398/2,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: tPlatformImage,
      block: true
    }),
    new Platform({
      x: 5.5*canvas.width + 398/2 + tPlatformImage.width + 150,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 5.5*canvas.width + 398/2 + tPlatformImage.width + blockImage.width +2*150,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: tPlatformImage,
      block: true
    }),
    new Platform({
      x: 5.5*canvas.width + 398/2 + 2*tPlatformImage.width + blockImage.width +3*150,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 5.5*canvas.width + 398/2 + 2*tPlatformImage.width + 2*blockImage.width +4*150,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: xtPlatformImage,
      block: true
    }),
    new Platform({
      x: 5.5*canvas.width + 398/2 + 3*tPlatformImage.width + 2*blockImage.width +5*150,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 5.5*canvas.width + 398/2 + 3*tPlatformImage.width + 3*blockImage.width +6*150,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: xtPlatformImage,
      block: true
    }),
    //1-5
    new Platform({
      x: 7.5*canvas.width + 248/2,
      y: canvas.height - lgPlatformImage.height - blockImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 100 + blockImage.width,
      y: canvas.height - lgPlatformImage.height - block2Image.height,
      image: block2Image,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 2*100 + 2*blockImage.width,
      y: canvas.height - lgPlatformImage.height - block3Image.height,
      image: block3Image,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 2*100 + 3*blockImage.width + 150,
      y: canvas.height - lgPlatformImage.height - block3Image.height,
      image: blockTriImage,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 2*100 + 3*blockImage.width + 2*150 + blockTriImage.width,
      y: canvas.height - lgPlatformImage.height - block3Image.height,
      image: block3Image,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 3*100 + 4*blockImage.width + 2*150 + blockTriImage.width,
      y: canvas.height - lgPlatformImage.height - block4Image.height,
      image: block4Image,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 3*100 + 5*blockImage.width + 3*150 + blockTriImage.width,
      y: canvas.height - lgPlatformImage.height - block3Image.height,
      image: blockTriImage,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 3*100 + 5*blockImage.width + 4*150 + 2*blockTriImage.width,
      y: canvas.height - lgPlatformImage.height - block4Image.height,
      image: block4Image,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 4*100 + 6*blockImage.width + 4*150 + 2*blockTriImage.width,
      y: canvas.height - lgPlatformImage.height - block3Image.height,
      image: block3Image,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 5*100 + 7*blockImage.width + 4*150 + 2*blockTriImage.width,
      y: canvas.height - lgPlatformImage.height - block2Image.height,
      image: block2Image,
      block: true
    }),
    // 1-6
    new Platform({
      x: 9.5*canvas.width + 268/2,
      y: canvas.height - lgPlatformImage.height - blockImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + blockImage.width,
      y: canvas.height - lgPlatformImage.height - block4Image.height,
      image: block4Image,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 2*blockImage.width,
      y: canvas.height - lgPlatformImage.height - blockImage.height,
      image: blockImage,
      block: true
    }),
    // flyingPlatform 123 
    new Platform({
      x: 9.5*canvas.width + 268/2 + 2*blockImage.width + 120,
      y: canvas.height - lgPlatformImage.height - block6Image.height,
      image: flyingPlatformImage,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 2*blockImage.width + flyingPlatformImage.width + 2*120,
      y: canvas.height - lgPlatformImage.height - block4Image.height,
      image: flyingPlatformImage,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 2*blockImage.width + 2*flyingPlatformImage.width + 3*120,
      y: canvas.height - lgPlatformImage.height - block6Image.height,
      image: flyingPlatformImage,
      block: true
    }),
    // blockTri block 1234
    new Platform({
      x: 9.5*canvas.width + 268/2 + 2*blockImage.width + 3*flyingPlatformImage.width + 4*120,
      y: canvas.height - lgPlatformImage.height - block4Image.height,
      image: block4Image,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 3*blockImage.width + 3*flyingPlatformImage.width + 4*120,
      y: canvas.height - lgPlatformImage.height - blockImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 3*blockImage.width + 3*flyingPlatformImage.width + 5*120,
      y: canvas.height - lgPlatformImage.height - block5Image.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 4*blockImage.width + 3*flyingPlatformImage.width + 6*120,
      y: canvas.height - lgPlatformImage.height - 7*blockImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 5*blockImage.width + 3*flyingPlatformImage.width + 7*120,
      y: canvas.height - lgPlatformImage.height - block5Image.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 6*blockImage.width + 3*flyingPlatformImage.width + 8*120,
      y: canvas.height - lgPlatformImage.height - 7*blockImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 7*blockImage.width + 3*flyingPlatformImage.width + 9*120,
      y: canvas.height - lgPlatformImage.height - block4Image.height,
      image: block4Image,
      block: true
    }),
    // 1-7
    new Platform({
      x: 11.5*canvas.width + 248/2,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: tPlatformImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + 50,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height - 150,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + tPlatformImage.width + 50,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height - 150,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + tPlatformImage.width + blockImage.width + 200,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height - 150,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + tPlatformImage.width + 2*blockImage.width + 275,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height - 150,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + tPlatformImage.width + 3*blockImage.width + 400,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height - 150,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + tPlatformImage.width + 4*blockImage.width + 500,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: xtPlatformImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + 2*tPlatformImage.width + 4*blockImage.width + 600,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + 2*tPlatformImage.width + 5*blockImage.width + 725,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + 2*tPlatformImage.width + 6*blockImage.width + 800,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + 2*tPlatformImage.width + 7*blockImage.width + 950,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + 2*tPlatformImage.width + 8*blockImage.width + 1000,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: xtPlatformImage,
      block: true
    }),
    // 1-8
    // block 123456
    new Platform({
      x: 13.5*canvas.width + 448/2,
      y: canvas.height-lgPlatformImage.height-blockImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + blockImage.width,
      y: canvas.height-lgPlatformImage.height-block2Image.height,
      image: block2Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 2*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block3Image.height,
      image: block3Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 3*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block4Image.height,
      image: block4Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 4*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block5Image.height,
      image: block5Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 5*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block6Image.height,
      image: block6Image,
      block: true
    }),
    // 100 block 200 block
    new Platform({
      x: 13.5*canvas.width + 448/2 + 6*blockImage.width + 100,
      y: canvas.height-lgPlatformImage.height-2*blockImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 7*blockImage.width + 100 + 150,
      y: canvas.height-lgPlatformImage.height-4*blockImage.height,
      image: blockImage,
      block: true
    }),
    //block 654321
    new Platform({
      x: 13.5*canvas.width + 448/2 + 8*blockImage.width + 100 + 2*150,
      y: canvas.height-lgPlatformImage.height-block6Image.height,
      image: block6Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 9*blockImage.width + 100 + 2*150,
      y: canvas.height-lgPlatformImage.height-block5Image.height,
      image: block5Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 10*blockImage.width + 100 + 2*150,
      y: canvas.height-lgPlatformImage.height-block4Image.height,
      image: block4Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 11*blockImage.width + 100 + 2*150,
      y: canvas.height-lgPlatformImage.height-block3Image.height,
      image: block3Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 12*blockImage.width + 100 + 2*150,
      y: canvas.height-lgPlatformImage.height-block2Image.height,
      image: block2Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 13*blockImage.width + 100 + 2*150,
      y: canvas.height-lgPlatformImage.height-blockImage.height,
      image: blockImage,
      block: true
    }),
    // block 123456
    new Platform({
      x: 13.5*canvas.width + 448/2 + 13*blockImage.width + 100 + 2*150 +200,
      y: canvas.height-lgPlatformImage.height-blockImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 14*blockImage.width + 100 + 2*150 +200,
      y: canvas.height-lgPlatformImage.height-block2Image.height,
      image: block2Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 15*blockImage.width + 100 + 2*150 +200,
      y: canvas.height-lgPlatformImage.height-block3Image.height,
      image: block3Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 16*blockImage.width + 100 + 2*150 +200,
      y: canvas.height-lgPlatformImage.height-block4Image.height,
      image: block4Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 17*blockImage.width + 100 + 2*150 +200,
      y: canvas.height-lgPlatformImage.height-block5Image.height,
      image: block5Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 18*blockImage.width + 100 + 2*150 +200,
      y: canvas.height-lgPlatformImage.height-block6Image.height,
      image: block6Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 19*blockImage.width + 100 + 2*150 +200,
      y: canvas.height-lgPlatformImage.height-block6Image.height,
      image: block6Image,
      block: true
    }),

  ]
  genericObjects = [
    new GenericObject({
      x: 0,
      y: 0,
      image: createImage(background)
    }),
    new GenericObject({
      x: 0,
      y: 30,
      image: createImage(hillsClouds)
    }) 
  ]

  scrollOffset = 0

  const platformsMap = [
    'lg',
    'lg',
    'lg',
    'lg',
    'lg',
    'lg',
    'lg',
    'lg',
    'lg'
  ]

  let platformDistance = 0

  platformsMap.forEach((symbol) => {
    switch (symbol) {
      case 'lg':
        platforms.push(
          new Platform({
            x: platformDistance,
            y: canvas.height - lgPlatformImage.height,
            image: lgPlatformImage,
            block: true,
            text: platformDistance
          })
        )

        platformDistance += lgPlatformImage.width - 2

        break

      case 'gap':
        platformDistance += 175

        break

      case 't':
        platforms.push(
          new Platform({
            x: platformDistance,
            y: canvas.height - tPlatformImage.height,
            image: tPlatformImage,
            block: true
          })
        )

        platformDistance += tPlatformImage.width - 2

        break

      case 'xt':
        platforms.push(
          new Platform({
            x: platformDistance,
            y: canvas.height - xtPlatformImage.height,
            image: xtPlatformImage,
            block: true,
            text: platformDistance
          })
        )

        platformDistance += xtPlatformImage.width - 2

        break
    }
  })
}

async function initLevel3() {
  player = new Player()
  keys = {
    right: {
      pressed: false
    },
    left: {
      pressed: false
    }
  }
  scrollOffset = 0

  game = {
    disableUserInput: false
  }

  platformImage = await createImageAsync(platform)
  platformSmallTallImage = await createImageAsync(platformSmallTall)
  blockTriImage = await createImageAsync(blockTri)
  blockImage = await createImageAsync(block)
  block2Image = await createImageAsync(block2)
  block3Image = await createImageAsync(block3)
  block4Image = await createImageAsync(block4)
  block5Image = await createImageAsync(block5)
  block6Image = await createImageAsync(block6)
  lgPlatformImage = await createImageAsync(lgPlatform)
  flyingPlatformImage = await createImageAsync(flyingPlatform)
  tPlatformImage = await createImageAsync(tPlatform)
  xtPlatformImage = await createImageAsync(xtPlatform)
  flagPoleImage = await createImageAsync(flagPoleSprite)

  flagPole = new GenericObject({
    x: 15.5*canvas.width,
    y: canvas.height - lgPlatformImage.height - flagPoleImage.height,
    image: flagPoleImage
  })


  /* fireFlowers = [
    new FireFlower({
      position: {
        x: 400,
        y: 100
      },
      velocity: {
        x: 0,
        y: 0
      }
    })
  ] */
  
  player = new Player()
  const cockcroachWidth = 43.33
  cockroachs = []
  particles = []
  platforms = [
    //1-1
    new Platform({
      x: 0.5*canvas.width + 274/2,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: tPlatformImage,
      block: true
    }),
    new Platform({
      x: 0.5*canvas.width + 274/2 + tPlatformImage.width + 150,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: tPlatformImage,
      block: true
    }),
    new Platform({
      x: 0.5*canvas.width + 274/2 + 2*tPlatformImage.width + 2*150,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: xtPlatformImage,
      block: true
    }),
    // 1-2
    // 第一列
    new Platform({
      x: 1.5*canvas.width + 98/2,
      y: canvas.height-lgPlatformImage.height-blockImage.height,
      image: blockImage,
      block: true
    }),
    // 第二列
    new Platform({
      x: 1.5*canvas.width + 98/2 + blockImage.width,
      y: canvas.height-lgPlatformImage.height-block2Image.height,
      image: block2Image,
      block: true
    }),
    // 第三列
    new Platform({
      x: 1.5*canvas.width + 98/2 + 2*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block3Image.height,
      image: block3Image,
      block: true
    }),
    // 第四列
    new Platform({
      x: 1.5*canvas.width + 98/2 + 3*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block4Image.height,
      image: block4Image,
      block: true
    }),
    // 第五列
    new Platform({
      x: 1.5*canvas.width + 98/2 + 4*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block5Image.height,
      image: block5Image,
      block: true
    }),
    // 第六列
    new Platform({
      x: 1.5*canvas.width + 98/2 + 5*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block6Image.height,
      image: block6Image,
      block: true
    }),
    //flyingplatform1
    new Platform({
      x: 1.5*canvas.width + 98/2 + 6*blockImage.width + 150,
      y: canvas.height-lgPlatformImage.height-6*blockImage.height,
      image: flyingPlatformImage,
      block: true,
    }),
    new Platform({
      x: 1.5*canvas.width + 98/2 + 6*blockImage.width + flyingPlatformImage.width + 2*150,
      y: canvas.height-lgPlatformImage.height-6*blockImage.height,
      image: flyingPlatformImage,
      block: true
    }),
    //block6
    new Platform({
      x: 1.5*canvas.width + 98/2 + 6*blockImage.width + 2*flyingPlatformImage.width + 3*150,
      y: canvas.height-lgPlatformImage.height-block6Image.height,
      image: block6Image,
      block: true
    }),
    //flyingplatform2
    new Platform({
      x: 1.5*canvas.width + 98/2 + 6*blockImage.width + 2*flyingPlatformImage.width + block6Image.width + 4*150,
      y: canvas.height-lgPlatformImage.height-6*blockImage.height,
      image: flyingPlatformImage,
      block: true
    }),
    new Platform({
      x: 1.5*canvas.width + 98/2 + 6*blockImage.width + 3*flyingPlatformImage.width + block6Image.width + 5*150,
      y: canvas.height-lgPlatformImage.height-6*blockImage.height,
      image: flyingPlatformImage,
      block: true
    }),
    //block 654321
    new Platform({
      x: 1.5*canvas.width + 98/2 + 6*blockImage.width + 4*flyingPlatformImage.width + block6Image.width + 6*150,
      y: canvas.height-lgPlatformImage.height-block6Image.height,
      image: block6Image,
      block: true
    }),
    new Platform({
      x: 1.5*canvas.width + 98/2 + 7*blockImage.width + 4*flyingPlatformImage.width + block6Image.width + 6*150,
      y: canvas.height-lgPlatformImage.height-block5Image.height,
      image: block5Image,
      block: true
    }),
    new Platform({
      x: 1.5*canvas.width + 98/2 + 8*blockImage.width + 4*flyingPlatformImage.width + block6Image.width + 6*150,
      y: canvas.height-lgPlatformImage.height-block4Image.height,
      image: block4Image,
      block: true
    }),
    new Platform({
      x: 1.5*canvas.width + 98/2 + 9*blockImage.width + 4*flyingPlatformImage.width + block6Image.width + 6*150,
      y: canvas.height-lgPlatformImage.height-block3Image.height,
      image: block3Image,
      block: true
    }),
    new Platform({
      x: 1.5*canvas.width + 98/2 + 10*blockImage.width + 4*flyingPlatformImage.width + block6Image.width + 6*150,
      y: canvas.height-lgPlatformImage.height-block2Image.height,
      image: block2Image,
      block: true
    }),
    new Platform({
      x: 1.5*canvas.width + 98/2 + 11*blockImage.width + 4*flyingPlatformImage.width + block6Image.width + 6*150,
      y: canvas.height-lgPlatformImage.height-blockImage.height,
      image: blockImage,
      block: true
    }),
    //1-3
    new Platform({
      x: 3.5*canvas.width + 148/2 + 200,
      y: canvas.height-lgPlatformImage.height-tPlatformImage.height,
      image: blockTriImage,
      block: true
    }),
    new Platform({
      x: 3.5*canvas.width + 148/2 + 200 + blockTriImage.width + 100,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: tPlatformImage,
      block: true
    }),
    new Platform({
      x: 3.5*canvas.width + 148/2 + 2*200 + blockTriImage.width + tPlatformImage.width + 100,
      y: canvas.height-lgPlatformImage.height-tPlatformImage.height,
      image: blockTriImage,
      block: true
    }),
    new Platform({
      x: 3.5*canvas.width + 148/2 + 2*200 + 2*blockTriImage.width + tPlatformImage.width + 2*100,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: xtPlatformImage,
      block: true
    }),
    new Platform({
      x: 3.5*canvas.width + 148/2 + 3*200 + 2*blockTriImage.width + 2*tPlatformImage.width + 2*100 + 2/3*blockTriImage.width,
      y: canvas.height-lgPlatformImage.height-tPlatformImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 3.5*canvas.width + 148/2 + 3*200 + 3*blockTriImage.width + 2*tPlatformImage.width + 3*100,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: xtPlatformImage,
      block: true
    }),
    //1-4
    new Platform({
      x: 5.5*canvas.width + 398/2,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: tPlatformImage,
      block: true
    }),
    new Platform({
      x: 5.5*canvas.width + 398/2 + tPlatformImage.width + 150,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 5.5*canvas.width + 398/2 + tPlatformImage.width + blockImage.width +2*150,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: tPlatformImage,
      block: true
    }),
    new Platform({
      x: 5.5*canvas.width + 398/2 + 2*tPlatformImage.width + blockImage.width +3*150,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 5.5*canvas.width + 398/2 + 2*tPlatformImage.width + 2*blockImage.width +4*150,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: xtPlatformImage,
      block: true
    }),
    new Platform({
      x: 5.5*canvas.width + 398/2 + 3*tPlatformImage.width + 2*blockImage.width +5*150,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 5.5*canvas.width + 398/2 + 3*tPlatformImage.width + 3*blockImage.width +6*150,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: xtPlatformImage,
      block: true
    }),
    //1-5
    new Platform({
      x: 7.5*canvas.width + 248/2,
      y: canvas.height - lgPlatformImage.height - blockImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 100 + blockImage.width,
      y: canvas.height - lgPlatformImage.height - block2Image.height,
      image: block2Image,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 2*100 + 2*blockImage.width,
      y: canvas.height - lgPlatformImage.height - block3Image.height,
      image: block3Image,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 2*100 + 3*blockImage.width + 150,
      y: canvas.height - lgPlatformImage.height - block3Image.height,
      image: blockTriImage,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 2*100 + 3*blockImage.width + 2*150 + blockTriImage.width,
      y: canvas.height - lgPlatformImage.height - block3Image.height,
      image: block3Image,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 3*100 + 4*blockImage.width + 2*150 + blockTriImage.width,
      y: canvas.height - lgPlatformImage.height - block4Image.height,
      image: block4Image,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 3*100 + 5*blockImage.width + 3*150 + blockTriImage.width,
      y: canvas.height - lgPlatformImage.height - block3Image.height,
      image: blockTriImage,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 3*100 + 5*blockImage.width + 4*150 + 2*blockTriImage.width,
      y: canvas.height - lgPlatformImage.height - block4Image.height,
      image: block4Image,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 4*100 + 6*blockImage.width + 4*150 + 2*blockTriImage.width,
      y: canvas.height - lgPlatformImage.height - block3Image.height,
      image: block3Image,
      block: true
    }),
    new Platform({
      x: 7.5*canvas.width + 248/2 + 5*100 + 7*blockImage.width + 4*150 + 2*blockTriImage.width,
      y: canvas.height - lgPlatformImage.height - block2Image.height,
      image: block2Image,
      block: true
    }),
    // 1-6
    new Platform({
      x: 9.5*canvas.width + 268/2,
      y: canvas.height - lgPlatformImage.height - blockImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + blockImage.width,
      y: canvas.height - lgPlatformImage.height - block4Image.height,
      image: block4Image,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 2*blockImage.width,
      y: canvas.height - lgPlatformImage.height - blockImage.height,
      image: blockImage,
      block: true
    }),
    // flyingPlatform 123 
    new Platform({
      x: 9.5*canvas.width + 268/2 + 2*blockImage.width + 120,
      y: canvas.height - lgPlatformImage.height - block6Image.height,
      image: flyingPlatformImage,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 2*blockImage.width + flyingPlatformImage.width + 2*120,
      y: canvas.height - lgPlatformImage.height - block4Image.height,
      image: flyingPlatformImage,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 2*blockImage.width + 2*flyingPlatformImage.width + 3*120,
      y: canvas.height - lgPlatformImage.height - block6Image.height,
      image: flyingPlatformImage,
      block: true
    }),
    // blockTri block 1234
    new Platform({
      x: 9.5*canvas.width + 268/2 + 2*blockImage.width + 3*flyingPlatformImage.width + 4*120,
      y: canvas.height - lgPlatformImage.height - block4Image.height,
      image: block4Image,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 3*blockImage.width + 3*flyingPlatformImage.width + 4*120,
      y: canvas.height - lgPlatformImage.height - blockImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 3*blockImage.width + 3*flyingPlatformImage.width + 5*120,
      y: canvas.height - lgPlatformImage.height - block5Image.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 4*blockImage.width + 3*flyingPlatformImage.width + 6*120,
      y: canvas.height - lgPlatformImage.height - 7*blockImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 5*blockImage.width + 3*flyingPlatformImage.width + 7*120,
      y: canvas.height - lgPlatformImage.height - block5Image.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 6*blockImage.width + 3*flyingPlatformImage.width + 8*120,
      y: canvas.height - lgPlatformImage.height - 7*blockImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 9.5*canvas.width + 268/2 + 7*blockImage.width + 3*flyingPlatformImage.width + 9*120,
      y: canvas.height - lgPlatformImage.height - block4Image.height,
      image: block4Image,
      block: true
    }),
    // 1-7
    new Platform({
      x: 11.5*canvas.width + 248/2,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height,
      image: tPlatformImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + 50,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height - 150,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + tPlatformImage.width + 50,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height - 150,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + tPlatformImage.width + blockImage.width + 200,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height - 150,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + tPlatformImage.width + 2*blockImage.width + 275,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height - 150,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + tPlatformImage.width + 3*blockImage.width + 400,
      y: canvas.height - lgPlatformImage.height - tPlatformImage.height - 150,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + tPlatformImage.width + 4*blockImage.width + 500,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: xtPlatformImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + 2*tPlatformImage.width + 4*blockImage.width + 600,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + 2*tPlatformImage.width + 5*blockImage.width + 725,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + 2*tPlatformImage.width + 6*blockImage.width + 800,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + 2*tPlatformImage.width + 7*blockImage.width + 950,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 11.5*canvas.width + 248/2 + 2*tPlatformImage.width + 8*blockImage.width + 1000,
      y: canvas.height - lgPlatformImage.height - xtPlatformImage.height,
      image: xtPlatformImage,
      block: true
    }),
    // 1-8
    // block 123456
    new Platform({
      x: 13.5*canvas.width + 448/2,
      y: canvas.height-lgPlatformImage.height-blockImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + blockImage.width,
      y: canvas.height-lgPlatformImage.height-block2Image.height,
      image: block2Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 2*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block3Image.height,
      image: block3Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 3*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block4Image.height,
      image: block4Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 4*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block5Image.height,
      image: block5Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 5*blockImage.width,
      y: canvas.height-lgPlatformImage.height-block6Image.height,
      image: block6Image,
      block: true
    }),
    // 100 block 200 block
    new Platform({
      x: 13.5*canvas.width + 448/2 + 6*blockImage.width + 100,
      y: canvas.height-lgPlatformImage.height-2*blockImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 7*blockImage.width + 100 + 150,
      y: canvas.height-lgPlatformImage.height-4*blockImage.height,
      image: blockImage,
      block: true
    }),
    //block 654321
    new Platform({
      x: 13.5*canvas.width + 448/2 + 8*blockImage.width + 100 + 2*150,
      y: canvas.height-lgPlatformImage.height-block6Image.height,
      image: block6Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 9*blockImage.width + 100 + 2*150,
      y: canvas.height-lgPlatformImage.height-block5Image.height,
      image: block5Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 10*blockImage.width + 100 + 2*150,
      y: canvas.height-lgPlatformImage.height-block4Image.height,
      image: block4Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 11*blockImage.width + 100 + 2*150,
      y: canvas.height-lgPlatformImage.height-block3Image.height,
      image: block3Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 12*blockImage.width + 100 + 2*150,
      y: canvas.height-lgPlatformImage.height-block2Image.height,
      image: block2Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 13*blockImage.width + 100 + 2*150,
      y: canvas.height-lgPlatformImage.height-blockImage.height,
      image: blockImage,
      block: true
    }),
    // block 123456
    new Platform({
      x: 13.5*canvas.width + 448/2 + 13*blockImage.width + 100 + 2*150 +200,
      y: canvas.height-lgPlatformImage.height-blockImage.height,
      image: blockImage,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 14*blockImage.width + 100 + 2*150 +200,
      y: canvas.height-lgPlatformImage.height-block2Image.height,
      image: block2Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 15*blockImage.width + 100 + 2*150 +200,
      y: canvas.height-lgPlatformImage.height-block3Image.height,
      image: block3Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 16*blockImage.width + 100 + 2*150 +200,
      y: canvas.height-lgPlatformImage.height-block4Image.height,
      image: block4Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 17*blockImage.width + 100 + 2*150 +200,
      y: canvas.height-lgPlatformImage.height-block5Image.height,
      image: block5Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 18*blockImage.width + 100 + 2*150 +200,
      y: canvas.height-lgPlatformImage.height-block6Image.height,
      image: block6Image,
      block: true
    }),
    new Platform({
      x: 13.5*canvas.width + 448/2 + 19*blockImage.width + 100 + 2*150 +200,
      y: canvas.height-lgPlatformImage.height-block6Image.height,
      image: block6Image,
      block: true
    }),

  ]
  genericObjects = [
    new GenericObject({
      x: 0,
      y: 0,
      image: createImage(background)
    }),
    new GenericObject({
      x: 0,
      y: 30,
      image: createImage(hillsClouds)
    }) 
  ]

  scrollOffset = 0

  const platformsMap = [
    'lg',
    'lg',
    'lg',
    'lg',
    'lg',
    'lg',
    'lg',
    'lg',
    'lg'
  ]

  let platformDistance = 0

  platformsMap.forEach((symbol) => {
    switch (symbol) {
      case 'lg':
        platforms.push(
          new Platform({
            x: platformDistance,
            y: canvas.height - lgPlatformImage.height,
            image: lgPlatformImage,
            block: true,
            text: platformDistance
          })
        )

        platformDistance += lgPlatformImage.width - 2

        break

      case 'gap':
        platformDistance += 175

        break

      case 't':
        platforms.push(
          new Platform({
            x: platformDistance,
            y: canvas.height - tPlatformImage.height,
            image: tPlatformImage,
            block: true
          })
        )

        platformDistance += tPlatformImage.width - 2

        break

      case 'xt':
        platforms.push(
          new Platform({
            x: platformDistance,
            y: canvas.height - xtPlatformImage.height,
            image: xtPlatformImage,
            block: true,
            text: platformDistance
          })
        )

        platformDistance += xtPlatformImage.width - 2

        break
    }
  })
}

function animate() {
  requestAnimationFrame(animate)
  c.fillStyle = 'white'
  c.fillRect(0, 0, canvas.width, canvas.height)

  genericObjects.forEach((genericObject) => {
    genericObject.update()
    genericObject.velocity.x = 0
  })

  platforms.forEach((platform) => {
    platform.update()
    platform.velocity.x = 0
  })

  if (flagPole) {
    flagPole.update()
    flagPole.velocity.x = 0

    // panda touches flagpole
    // win condition
    // complete level
    if (
      !game.disableUserInput &&
      objectsSideTouch({
        object1: player,
        object2: flagPole
      })
    ) {
      audio.completeLevel.play()
      audio.musicLevel1.stop()
      game.disableUserInput = true
      player.velocity.x = 0
      player.velocity.y = 0
      gravity = 0

      player.currentSprite = player.sprites.stand.right

      gsap.to(player.position, {
        y: canvas.height - lgPlatformImage.height - player.height,
        duration: 1,
        onComplete() {
          player.currentSprite = player.sprites.run.right

        }
      })
      
      // flagpole slide
      setTimeout(() => {
        audio.descend.play()
      }, 200)

      gsap.to(player.position, {
        delay: 1,
        x: canvas.width,
        duration: 2,
        ease: 'power1.in'
      })

      // switch to the next level
      setTimeout(() => {
        currentLevel++
        gravity = 0.78
        selectLevel(currentLevel)
      }, 8000)
    }
  }

  player.update()

  if (game.disableUserInput) return

  // scrolling code starts
  let hitSide = false

  if (keys.right.pressed && player.position.x < 400) {
    player.velocity.x = player.speed
  } else if (
    (keys.left.pressed && player.position.x > 100) ||
    (keys.left.pressed && scrollOffset === 0 && player.position.x > 0)
  ) {
    player.velocity.x = -player.speed
  } else {
    player.velocity.x = 0

    // scrolling code
    if (keys.right.pressed) {
      for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i]
        platform.velocity.x = -player.speed

        if (
          platform.block &&
          hitSideOfPlatform({
            object: player,
            platform
          })
        ) {
          platforms.forEach((platform) => {
            platform.velocity.x = 0
          })
          hitSide = true
          break
        }
      }

      if (!hitSide) {
        scrollOffset += player.speed

        flagPole.velocity.x = -player.speed

        genericObjects.forEach((genericObject) => {
          genericObject.velocity.x = -player.speed * 0.66
        })

        cockroachs.forEach((cockroach) => {
          cockroach.position.x -= player.speed
        })

        fireFlowers.forEach((fireFlower) => {
          fireFlower.position.x -= player.speed
        })

        particles.forEach((particle) => {
          particle.position.x -= player.speed
        })
      }
    } else if (keys.left.pressed && scrollOffset > 0) {
      for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i]
        platform.velocity.x = player.speed

        if (
          platform.block &&
          hitSideOfPlatform({
            object: player,
            platform
          })
        ) {
          platforms.forEach((platform) => {
            platform.velocity.x = 0
          })
          hitSide = true
          break
        }
      }

      if (!hitSide) {
        scrollOffset -= player.speed

        flagPole.velocity.x = player.speed

        genericObjects.forEach((genericObject) => {
          genericObject.velocity.x = player.speed * 0.66
        })

        cockroachs.forEach((cockroach) => {
          cockroach.position.x += player.speed
        })

        fireFlowers.forEach((fireFlower) => {
          fireFlower.position.x += player.speed
        })

        particles.forEach((particle) => {
          particle.position.x += player.speed
        })
      }
    }
  }

  // platform collision detection
  platforms.forEach((platform) => {
    if (
      isOnTopOfPlatform({
        object: player,
        platform
      })
    ) {
      player.velocity.y = 0
      jumpCount = 0
    }

    if (
      platform.block &&
      hitBottomOfPlatform({
        object: player,
        platform
      })
    ) {
      player.velocity.y = -player.velocity.y
    }

    if (
      platform.block &&
      hitSideOfPlatform({
        object: player,
        platform
      })
    ) {
      player.velocity.x = 0
    }
  })


  // lose condition
  if (player.position.y > canvas.height) {
    audio.die.play()
    init()
  }

  // sprite switching
  if (player.velocity.y !== 0) return

  if (
    keys.right.pressed &&
    lastKey === 'right' &&
    player.currentSprite !== player.sprites.run.right
  ) {
    player.currentSprite = player.sprites.run.right
  } else if (
    keys.left.pressed &&
    lastKey === 'left' &&
    player.currentSprite !== player.sprites.run.left
  ) {
    player.currentSprite = player.sprites.run.left
  } else if (
    !keys.left.pressed &&
    lastKey === 'left' &&
    player.currentSprite !== player.sprites.stand.left
  ) {
    player.currentSprite = player.sprites.stand.left
  } else if (
    !keys.right.pressed &&
    lastKey === 'right' &&
    player.currentSprite !== player.sprites.stand.right
  ) {
    player.currentSprite = player.sprites.stand.right
  }

  
}

selectLevel(1)
animate()

addEventListener('keydown', ({ keyCode }) => {
  console.log(keyCode)
  if (game.disableUserInput) return
  switch (keyCode) {
    case 37:
      keys.left.pressed = true
      lastKey = 'left'
    break

    case 39:
      keys.right.pressed = true
      lastKey = 'right'

    break

    case 32:
      if (isJumping === 0) {
        if (jumpCount === 0) {
          player.velocity.y -= 15
          audio.jump.play()
          if (lastKey === 'right') player.currentSprite = player.sprites.jump.right
          else if(lastKey === 'left') player.currentSprite = player.sprites.jump.left
          jumpCount++
        }
        isJumping = 1
      }
      
    break
  }
})

addEventListener('keyup', ({ keyCode }) => {
  if (game.disableUserInput) return
  switch (keyCode) {
    case 37:
      keys.left.pressed = false
      break

    case 39:
      keys.right.pressed = false

      break

    case 32:
      isJumping = 0
      break
  }
})
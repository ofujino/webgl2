import { vec3, mat4 } from 'gl-matrix'
import * as WGL from './wgl'

window.onload = () => {
  const canvas = document.getElementById('screen')

  canvas.width = 1024
  canvas.height = 768

  const gl = canvas.getContext('webgl2')
  const wgl = new WGL.Wrapper(gl)

  const program = wgl.program(vs, fs)
  const array = wgl.array([
    -1,  1, 0, 1, 0, 0, 0, 1,
    -1, -1, 0, 0, 1, 0, 0, 0,
     1,  1, 0, 0, 0, 1, 1, 1,
     1, -1, 0, 1, 1, 0, 1, 0,
  ])
  const index = wgl.index([
    0, 1, 2, 3,
  ])

  const model = mat4.create()
  const view  = mat4.create()
  const projection = mat4.create()

  mat4.lookAt(view, [0,0,5], [0,0,0], [0,1,0])
  mat4.perspective(projection, Math.PI/180*45, canvas.width/canvas.height, 0.001, 1000)

  const texture = wgl.texture(document.getElementById('webgl'))
  texture.bind()

  const render = () => {
    mat4.rotateY(model, model, Math.PI/180*0.4)

    gl.clearColor(0.7, 0.7, 0.9, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    program
      .use()
      .matrix('model', model)
      .matrix('view', view)
      .matrix('projection', projection)
      .uniform1i('sampler', 0)
      .attribute('position', array, 3, 8, 0)
      .attribute('color', array, 3, 8, 3)
      .attribute('uv', array, 2, 8, 6)
      .index(index)
      .draw(wgl.gl.TRIANGLE_STRIP, 4)
  }

  let requestId

  const loop = (arg) => {
    requestId = requestAnimationFrame(loop)
    try {
      render()
    } catch (err) {
      cancelAnimationFrame(requestId)
      console.error(err)
    }
  }

  loop()
}

const vs = `
#version 300 es
in vec4 position;
in vec3 color;
in vec2 uv;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
out vec3 vColor;
out vec2 vUV;
void main() {
  gl_Position = projection * view * model * position;
  vColor = color;;
  vUV = uv;
}
`.trim()

const fs = `
#version 300 es
precision mediump float;
in vec3 vColor;
in vec2 vUV;
uniform sampler2D sampler;
out vec4 color;
void main() {
  color = texture(sampler, vUV) * vec4(vColor, 1);
}
`.trim()


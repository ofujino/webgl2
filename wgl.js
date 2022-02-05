export class Wrapper {
  constructor (gl) {
    this.gl = gl
  }

  program (vertexSource, fragmentSource) {
    return new Program(this.gl, vertexSource, fragmentSource)
  }

  array (data) {
    return new ArrayBuffer(this.gl, data)
  }

  index (data) {
    return new ElementArrayBuffer(this.gl, data)
  }

  texture (image) {
    return new Texture(this.gl, image)
  }
}

class Program {
  constructor (gl, vs, fs) {
    this.gl = gl
    this.vertex   = this.compile(vs, gl.VERTEX_SHADER)
    this.fragment = this.compile(fs, gl.FRAGMENT_SHADER)
    this.program  = this.link(this.vertex, this.fragment)
    this.elementArrayBuffer = null
  }

  use () {
    this.gl.useProgram(this.program)
    return this
  }

  unuse () {
    this.gl.useProgram(null)
    return this
  }

  link (vs, fs) {
    const gl = this.gl
    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      console.error(info)
      throw new Error('Could not compile WebGL program.')
    }
    return program
  }

  compile (src, type) {
    const gl = this.gl
    const shader = gl.createShader(type)
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader)
      console.error(info)
      throw new Error('Could not compile WebGL shader.')
    }
    return shader
  }

  draw (mode, count) {
    if (this.elementArrayBuffer) {
      this.elementArrayBuffer.bind()
      this.gl.drawElements(mode, count, this.elementArrayBuffer.arraySize, 0)
      this.elementArrayBuffer.unbind()
    } else {
      this.gl.drawArrays(mode, 0, count)
    }
  }

  index (array) {
    this.elementArrayBuffer = array
    return this
  }

  matrix (name, value) {
    const gl = this.gl
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, name), false, value)
    return this
  }

  uniform3fv (name, value) {
    const gl = this.gl
    gl.uniform3fv(gl.getUniformLocation(this.program, name), value)
    return this
  }

  uniform1i (name, value) {
    const gl = this.gl
    gl.uniform1i(gl.getUniformLocation(this.program, name), value)
    return this
  }

  uniform4fv (name, value) {
    const gl = this.gl
    gl.uniform4fv(gl.getUniformLocation(this.program, name), value)
    return this
  }

  attribute (name, array, numComponents=3, stride=0, offset=0) {
    const gl = this.gl
    const location = gl.getAttribLocation(this.program, name)
    if (location == null) {
      throw new Error('invalid attribute location: "' + name + '"')
    }
    gl.enableVertexAttribArray(location)
    array.bind()
    array.pointer(location, numComponents, stride, offset)
    return this
  }

  attribute3fv (name, value) {
    const gl = this.gl
    const location = gl.getAttribLocation(this.program, name)
    gl.disableVertexAttribArray(location)
    gl.vertexAttrib3fv(location, value)
    return this
  }
}

class BaseBuffer {
  constructor (gl, type, arrayType, arraySize, data) {
    this.gl = gl
    this.type = type
    this.size = 0
    this.arrayType = arrayType
    this.arraySize = arraySize
    this.bytesPerElement = arrayType.BYTES_PER_ELEMENT
    this.buffer = gl.createBuffer()
    this.update(data)
  }

  update (data) {
    const gl = this.gl
    this.bind()
    const size = data.length || data
    if (this.size != size) {
      gl.bufferData(this.type, new this.arrayType(data), gl.STATIC_DRAW)
      this.size = size
    } else {
      gl.bufferSubData(this.type, 0, new this.arrayType(data))
    }
    this.unbind()
  }

  bind () {
    this.gl.bindBuffer(this.type, this.buffer)
  }

  unbind () {
    this.gl.bindBuffer(this.type, null)
  }

  pointer (location, numComponents, stride, offset) {
    const gl = this.gl
    gl.vertexAttribPointer(location, numComponents, this.arraySize, false, stride*this.bytesPerElement, offset*this.bytesPerElement)
  }
}

class ArrayBuffer extends BaseBuffer {
  constructor (gl, data) {
    super(gl, gl.ARRAY_BUFFER, Float32Array, gl.FLOAT, data)
  }
}

class ElementArrayBuffer extends BaseBuffer {
  constructor (gl, data) {
    super(gl, gl.ELEMENT_ARRAY_BUFFER, Uint32Array, gl.UNSIGNED_INT, data)
  }
}

class Texture {
  constructor (gl, image) {
    this.gl = gl
    this.texture = gl.createTexture()
    this.bind()
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST)
    gl.generateMipmap(gl.TEXTURE_2D)
  }

  bind () {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture)
  }

  unbind () {
    this.gl.bindTexture(this.gl.TEXTURE_2D, null)
  }
}


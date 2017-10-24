import Plugin from '../plugin'

describe('constructor test', () => {
  it('will create instance when parameters are collect', () => {
    expect(new Plugin('facedetection', 'http://localhost:10002/face')).toBeInstanceOf(Plugin)
  })

  it('will raise error when name is not string', () => {
    expect(() => new Plugin(0, 'http://localhost:10002/face')).toThrow()
  })

  it('will raise error when url is not string', () => {
    expect(() => new Plugin('facedetection', 0)).toThrow()
  })

  it('will raise error when url does not match url pattern ', () => {
    expect(() => new Plugin('facedetection', 'hoge')).toThrow()
  })
})

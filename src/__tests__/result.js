import Result from '../result'

describe('constructor test', () => {
  it('will create instance, when parameters are collect', () => {
    expect(new Result(new Buffer(0), {})).toBeInstanceOf(Result)
  })

  it('will raise error, when img param is not Buffer object', () => {
    expect(() => { new Result({}, {}) }).toThrow()
  })
  it('will raise error, when detected param is not object', () => {
    expect(() => { new Result( new Buffer(0), 1) }).toThrow()
  })
})

describe('base64Image test', () => {
  let res
  beforeEach(() => {
    res = new Result(new Buffer([0,1,2]), {})
  })
  afterEach(() => {
    res = null
  })

  it('will create base64 encoded string', () => {
    expect(res.base64Image()).toBe('AAEC')
  })
})

describe('num_keys test', () => {
  it('will return 1, when detected = {"a": 1}', () => {
    const res = new Result(new Buffer(1), {"a": 1})
    expect(res.num_keys).toBe(1)
  })

  it('will return 0, when detected = {}', () => {
    const res = new Result(new Buffer(1), {})
    expect(res.num_keys).toBe(0)
  })

  it('will return 0, when detected = {md_score:0, md_rect: null}', () => {
    const res = new Result(new Buffer(1), {md_score: 0, md_rect: null})
    expect(res.num_keys).toBe(0)
  })

  it('will return 1, when detected = {md_score:0, md_rect: null, a: 1}', () => {
    const res = new Result(new Buffer(1), {md_score: 0, md_rect: null, a: 1})
    expect(res.num_keys).toBe(1)
  })

  it('will return 3, when detected = {md_score:1, md_rect: {}, a: 1}', () => {
    const res = new Result(new Buffer(1), {md_score: 0, md_rect: null, a: 1})
    expect(res.num_keys).toBe(1)
  })
})

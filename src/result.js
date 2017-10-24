//@flow

/**
 * A class of Result
 *
 * @class
 *
 * @property {Buffer} img - jpg image
 * @property {Object} detected - detected result
 * @property {Number} num_keys - number of keys in detected property
 *
 * @param {Buffer} img - jpg image
 * @param {Object} detected - detected result
 */
class Result {
  img: Object
  detected: Object

  constructor(img: Object, detected: Object) {
    if( !(img instanceof Buffer) ) throw new Error('img should be Buffer object')
    if( typeof(detected) !== 'object' ) throw new Error('detected should be object')
    this.img = img
    this.detected = detected
  }

  get num_keys(): number {
    // when md_score === 0, we'll decrease 2 from num for md_score and md_rect.
    let num = 0

    for(let key in this.detected) if (this.detected.hasOwnProperty(key)) num++

    if(this.detected.md_score === 0) num -= 2

    return num
  }

  /**
   * get base64image string from img property
   *
   * @example
   * const res = new Result(jpeg_img, {})
   * res.base64Image()
   * // #=> <base64 encoded string>
   *
   * @method Result#base64Image
   *
   * @returns {string} - base64 encoded imaage
   */
  base64Image() {
    return this.img.toString('base64')
  }
}

export default Result

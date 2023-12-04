import * as moment from 'moment';


export class Js2zplService {


  static knownElements = ['rectangle', 'circle', 'barcode', 'datamatrix', 'text', 'scalabletext'];
  inverted: any;
  can_rotate: any;
  encoding: any;
  dpmm: any;
  labeltop: any;
  labelleft: any;
  offsettop: any;
  offsetleft: any;
  widthMm: any;
  heightMm: any;
  width: any;
  height: any;
  dateformat: any;
  print_rate: any;
  media_darkness: any;
  media_type: any;
  layout_name: any;
  layout_storage: any;
  alldata: any;
  alternative_price_notation: any;


  /** *
   * constructor()
   * Expects an Object with the following variables
   *
   * name							type		default		comment
   * -----------------------------------------------------------
   * width						int 					the printable area in mm
   * height						int 					the printable height in mm
   * elements						array					See documentation
   * offsettop					int			0			measured in mm
   * offsetleft					int 		0			measured in mm
   * dpmm							int			8			203dpi = 8mm, 300dpi = 12mm
   * encoding						int			28			28 = UTF, extra4 uses 27 (see https://support.zebra.com/cpws/docs/zpl/13979l-010_ra.pdf, pag 150)
   * inverted						boolean		false		whether the contents should be printed on the opposite side of the label
   * print_rate					int		    2           the speed of the printing
   * media_darkness               int         12          The 'intensity' of the printing. A higher value will give a darker print
   * -----------------------------------------------------------
   */
  constructor(template: any) {

    //set optional parameters to their default values when they are not passed
    this.inverted = (typeof template.inverted !== 'undefined') ? template.inverted : false;
    this.can_rotate = (typeof template.can_rotate !== 'undefined') ? template.can_rotate : true; //should be false for Intermec printers
    this.encoding = (typeof template.encoding !== 'undefined') ? template.encoding : 28;
    this.dpmm = (typeof template.dpmm !== 'undefined') ? Number(template.dpmm) : 8;

    this.labeltop = (typeof template.labeltop !== 'undefined') ? Number(template.labeltop) : 0;
    this.labelleft = (typeof template.labelleft !== 'undefined') ? Number(template.labelleft) : 0;

    this.offsettop = (typeof template.offsettop !== 'undefined') ? Number(this.convertToDots(template.offsettop)) : 0;
    this.offsetleft = (typeof template.offsetleft !== 'undefined') ? Number(this.convertToDots(template.offsetleft)) : 0;

    //save the original dimensions provided in mm
    this.widthMm = Number(template.width);
    this.heightMm = Number(template.height);

    //convert the dimensions to dots for further usage
    this.width = Number(this.convertToDots(template.width));
    this.height = Number(this.convertToDots(template.height));

    this.dateformat = (typeof template.dateformat !== 'undefined') ? template.dateformat : 'MM/YY'; //0620
    this.print_rate = (typeof template.print_rate !== 'undefined') ? template.print_rate : 2;
    this.media_darkness = (typeof template.media_darkness !== 'undefined') ? template.media_darkness : 12;
    this.media_type = (typeof template.media_type !== 'undefined') ? template.media_type : 'T';

    this.layout_name = (typeof template.layout_name !== 'undefined') ? template.layout_name : '';

    /** Layout storage */
    //B: memory card
    //E: Flash Memory (default)
    //R: RAM
    this.layout_storage = (typeof template.layout_storage !== 'undefined') ? template.layout_storage : 'E';
    this.alternative_price_notation = (typeof template.alternative_price_notation !== 'undefined') ? template.alternative_price_notation : false;

  }

  convertToInches(mmValue: any) {
    return Number(mmValue / 25.4).toFixed(2);
  }

  convertToDots(mmValue?: any) {
    return Number(mmValue * this.dpmm).toFixed(0);
  }

  half(value: any) {
    return Number(value / 2).toFixed(0);
  }

  quarter(value: any) {
    return Number(value / 4).toFixed(0);
  }

  startCommand() { return '^XA'; }
  endCommand() { return '^XZ'; }

  setOrigin(x = 0, y = 0) { return '^LH' + x + ',' + y; }

  changePosition(x = 0, y = 0) {
    return '^FO' + Number(x).toFixed(0) + ',' + Number(y).toFixed(0);
  }

  drawBarcode(data: any, w = 1, h = 15, barcodetype = 'C', showdata = 'N', fieldtype = 'D') {
    return '^BY' + w + ',3.0,' + h + '^B' + barcodetype + 'N,' + h + ',' + showdata.toUpperCase() + ',N,N,A^F' + fieldtype + data + '^FS';
  }

  drawDataMatrix(data: any, dotsize = 2, quality = 200, columns = 32, rows = 32, format = 3, fieldtype = 'D') {
    return '^BXN,' + dotsize + ',' + quality + ',' + columns + ',' + rows + ',' + format + '^F' + fieldtype + data + '^FS';
  }

  drawText(data = 'No data', fontid = 'Q', max = 0, blockwidth = 0, blocktextalign = "L", blocklines = 1, fieldtype = 'D', euro_prefix = false, pound_prefix = false) {

    if (blockwidth > 0) {
      var block = this.createTextBlock(blockwidth, blocktextalign, blocklines);
    } else {
      var block = "";
    }

    if (max) {
      data = this.createSubstring(data, max, '..');
    }

    var fh = ''
    var hex_euro = ''
    var hex_pound = ''

    if (euro_prefix && fieldtype === 'D') {
      if (this.encoding == 28) {
        fh = '^FH'
        hex_euro = '_E2_82_AC'
      } else {
        console.warn('Euro prefix only works with encoding 28..')
      }
    }

    if (pound_prefix && fieldtype === 'D') {
      if (this.encoding == 28) {
        fh = '^FH'
        hex_pound = '_C2_A3'
      } else {
        console.warn('Pound prefix only works with encoding 28..')
      }
    }

    return '^A' + fontid.toUpperCase() + 'N' + block + fh + '^F' + fieldtype + hex_euro + hex_pound + data + '^FS';
  }

  drawScalableText(data = 'No data', charwidth = 15, charheight = 15, max = 0, blockwidth = 0, blocktextalign = "L", blocklines = 1, fieldtype = 'D', euro_prefix = false, pound_prefix = false) {

    if (blockwidth > 0) {
      var block = this.createTextBlock(blockwidth, blocktextalign, blocklines);
    } else {
      var block = "";
    }

    if (max > 0) {
      data = this.createSubstring(data, max, '..');
    }

    var fh = ''
    var hex_euro = ''
    var hex_pound = ''

    if (euro_prefix && fieldtype === 'D') {
      if (this.encoding == 28) {
        fh = '^FH'
        hex_euro = '_E2_82_AC'
      } else {
        console.warn('Euro prefix only works with encoding 28..')
      }
    } else {
      if (!euro_prefix && String(data).startsWith('€')) {
        fh = '^FH'
        hex_euro = '_E2_82_AC'
        data = data.substring(1)
        console.warn('Replaced euro symbol with prefix..')
      }
    }

    if (pound_prefix && fieldtype === 'D') {
      if (this.encoding == 28) {
        fh = '^FH'
        hex_pound = '_C2_A3'
      } else {
        console.warn('Pound prefix only works with encoding 28..')
      }
    } else {
      if (!pound_prefix && String(data).startsWith('£')) {
        fh = '^FH'
        hex_pound = '_C2_A3'
        data = data.substring(1)
        console.warn('Replaced pound symbol with prefix..')
      }
    }

    return '^A0,' + charheight + ',' + charwidth + 'N' + block + fh + '^F' + fieldtype + hex_euro + hex_pound + data + '^FS';
  }

  createTextBlock(blockwidth: any, blocktextalign: any, blocklines: any) {
    return "^FB" + blockwidth + "," + blocklines + ",0," + blocktextalign + ",0";
  }

  drawCircle(size = 10, thickness = 1, color = 'b') {
    return '^GC' + size + ',' + thickness + ',' + color + '^FS';
  }

  drawRectangle(width: any, height: any, border = 1, color = 'b', rounding = 0) {
    return '^GB' + Number(width).toFixed(0) + ',' + Number(height).toFixed(0) + ',' + border + ',' + color + ',' + rounding + '^FS';
  }

  validateCommand(command: any) {
    return (typeof command == 'string' && command.indexOf('^XA') > -1 && command.indexOf('^XZ') > -1) ? command : '^FXValidation failed.. are XA and XZ included?';
  }

  isValidElement(element: any) {
    // console.log('checking element validity', element)
    //check if the element exists and if the neccesary parameters of the element type are present
    if (element.type !== undefined && Js2zplService.knownElements.indexOf(element.type) > -1) {
      switch (element.type) {
        case 'rectangle':
          return ("width" in element && "height" in element) ? true : false;
          break;

        case 'circle':
          return ("size" in element) ? true : false;
          break;

        case 'text':
          return ("pnfield" in element) ? true : false;
          break;

        case 'scalabletext':
          return ("pnfield" in element) ? true : false;
          break;

        case 'barcode':
          // console.log(218, "pnfield" in element)
          return ("pnfield" in element) ? true : false;
          break;

        case 'datamatrix':
          return ("pnfield" in element) ? true : false;
          break;

        default:
          return false;
      }

    } else {
      // console.error('Unknown element: "'+element.type+'"');
      return false;
    }
  }

  /**
   * value: the x or y value of the element
   * maxsize: the total width or height of label (this.width or this.height)
   */
  convertElementPosition(value: any, maxsize: any) {
    if (value == "half")
      value = Number(this.half(maxsize));

    if (value == "quarter")
      value = Number(this.quarter(maxsize));

    if (value == "max")
      value = maxsize;

    if (value == null || typeof value == 'undefined')
      value = 0;

    return value;
  }

  /**
   * value: the width or height value of the element
   * maxsize: the total width or height of label (this.width or this.height)
   */
  convertElementSize(value: any, maxsize: any) {

    if (value == 'half')
      value = Number(this.half(maxsize));

    if (value == 'quarter')
      value = Number(this.quarter(maxsize));

    if (value == 'max')
      value = parseInt(maxsize);

    if (value == null || typeof value == 'undefined')
      value = 0;

    return value;
  }

  getSettings() {

    var settings = '^CI' + this.encoding;

    settings += '^PW' + this.width + '^ML' + this.height
    settings += (this.inverted) ? '^POI' : '^PON';
    settings += '^PMN'
      + '^LS' + this.labelleft
      + '^LT' + this.labeltop
      + this.setOrigin(this.offsetleft, this.offsettop)
      + '^MD' + this.media_darkness
      + '^PR' + this.print_rate
      + '~TA021'
      + '^MNY' //media tracking
      + '^MM' + this.media_type;

    return settings;
  }

  factorySettings() {
    return '^XA^JUF^XS';
  }

  sendSettings(settingStr: any) {
    return '^XA' + settingStr + '^XZ';
  }

  saveSettings() {
    return '^XA^JUS^XZ';
  }

  zplCalibrate() {
    return '~jc';
  }

  generateCommand(request: any, data: any, layout_command = true) {
    if (!request) return
    if (data) { this.alldata = data; }


    //override label parameters if provided
    this.overrideVariables(request);

    var command = this.startCommand();

    var fieldtype = 'D'; //Will be used as ^FD for passing data 'hardcoded'

    if (this.layout_name.length > 0) {

      if (layout_command === true) {
        command += '^XF' + this.layout_storage + ':' + this.layout_name + '.ZPL';
      } else {
        if (this.layout_name.length > 0)
          command += '^DF' + this.layout_storage + ':' + this.layout_name + '.ZPL';
      }

      fieldtype = 'N'; //Will be used as ^FN(+field number) to reference a field in the layout
    }

    if (layout_command === false) {
      command += this.getSettings();
    }

    command += this.addFieldsToCommand(request, layout_command, fieldtype);

    command += this.endCommand();

    if (!data['%%QUANTITY%%']) {
      data['%%QUANTITY%%'] = 1;
    }
    command = command.replace('^XA', '^XA^PQ' + data['%%QUANTITY%%'])

    console.warn("Generated: ", layout_command, command, String(command).split(/(?=\^)/g));

    return this.validateCommand(command);
  }

  generatePreview(request: any, data: any) {

    if (data) {
      this.alldata = data;
    } else {
      return;
    }

    if (typeof request === 'undefined')
      return;

    this.overrideVariables(request);

    var command = this.startCommand();
    //command += this.getSettings(false);
    command += this.addFieldsToCommand(request, false, 'D', true);
    command += this.endCommand();

    return command;
  }

  addFieldsToCommand(request: any, layout_command: any, fieldtype: any, preview = false) {

    var command = '';

    Object.keys(request.elements)?.map((key: any) => {

      var field_id = Number(key) + 1;

      var element = request.elements[key];

      if (!element?.visible) {
        element.visible = true;
      }

      if (Boolean(element.visible) == true) {

        element.x = this.parseIfInteger(element.x);
        element.y = this.parseIfInteger(element.y);

        //check if the element is valid and contains required parameters
        if (element.type && this.isValidElement(element)) {

          if (this.can_rotate) {

            var rotate: any = '^FWN'

            if (element.rotation && element.rotation !== 0) {
              switch (element.rotation) {
                case 90:
                  rotate = '^FWR'
                  break;
                case 180:
                  rotate = '^FWI'
                  break;
                case 270:
                  rotate = '^FWB'
                  break;
                default:
                  rotate = '^FWN'
                  break;
              }
            }
          }

          if (layout_command === true) { // print actual data
            if (element.type !== 'rectangle' && element.type !== 'circle') {

              var fh = ''
              var hex_euro = ''
              var hex_pound = ''
              var prefix = ''

              if (element.euro_prefix) {
                if (this.encoding == 28) {
                  fh = '^FH'
                  hex_euro = '_E2_82_AC'
                } else {
                  console.warn('Euro prefix only works with encoding 28..')
                }
              }

              if (element.pound_prefix) {
                if (this.encoding == 28) {
                  fh = '^FH'
                  hex_pound = '_C2_A3'
                } else {
                  console.warn('Pound prefix only works with encoding 28..')
                }
              }

              if (element.prefix && element.prefix !== "") {
                prefix = element.prefix
              }

              if (this.can_rotate) {
                command += '^FN' + field_id + fh + rotate + '^FD' + hex_euro + hex_pound + prefix + this.getFieldData(element.pnfield) + '^FS';
              } else {
                command += '^FN' + field_id + fh + '^FD' + hex_euro + hex_pound + prefix + this.getFieldData(element.pnfield) + '^FS';
              }
            }
            // } else {  
            //   switch (element.type) {
            //     case 'rectangle':
            //       command += this.changePosition(element.x, element.y) + rotate + this.drawRectangle(element.width, element.height, element.border, element.color, element.rounding)
            //       break;
            //     case 'circle':
            //       command += rotate + this.drawCircle(element.size, element.border, element.color)
            //       break;
            //     case 'barcode':
            //       element.width = (element.width == 0) ? 1 : element.width;
            //       element.height = (element.height == 0) ? 15 : element.height;
            //       command += rotate + this.drawBarcode(this.getFieldData(element.pnfield), element.width, element.height, element.barcodetype, element.showdata, 'D')
            //       break;
            //   }
            // }

          } else {
            element.x = (element?.x) ? this.convertElementPosition(element.x, this.width) : 0;
            element.y = (element?.y) ? this.convertElementPosition(element.y, this.height) : 0;

            element.width = (element?.width) ? this.convertElementSize(element.width, this.width) : 0;
            element.height = (element?.height) ? this.convertElementSize(element.height, this.height) : 0;

            command += this.changePosition(element.x, element.y)

            if (this.can_rotate) {
              command += rotate
            }

            if (element.type !== 'rectangle' && element.type !== 'circle') {

              if (this.layout_name === '' || preview === true) {
                element.pnfield = this.getFieldData(element.pnfield);

              } else {
                element.pnfield = field_id;
              }
            }

            switch (element.type) {
              case 'rectangle':
                command += this.drawRectangle(element.width, element.height, element.border, element.color, element.rounding)
                break;

              case 'circle':
                command += this.drawCircle(element.size, element.border, element.color)
                break;

              case 'text':
                command += this.drawText(element.pnfield, element.font, element.max, element.blockwidth, element.blocktextalign, element.blocklines, fieldtype, element.euro_prefix, element.pound_prefix)
                break;

              case 'scalabletext':
                //element.pnfield = this.getFieldData(element.pnfield);
                command += this.drawScalableText(element.pnfield, element.charwidth, element.charheight, element.max, element.blockwidth, element.blocktextalign, element.blocklines, fieldtype, element.euro_prefix, element.pound_prefix)
                break;

              case 'barcode':
                element.width = (element.width == 0) ? 1 : element.width;
                element.height = (element.height == 0) ? 15 : element.height;
                command += this.drawBarcode(element.pnfield, element.width, element.height, element.barcodetype, element.showdata, fieldtype)
                break;

              case 'datamatrix':

                /**
                 * if we use dotsize 1, the generated matrix will either be too small or too detailed.
                 * We thus need a bigger dotsize, but dotsize 2 will double the size of the matrix on the label
                 * Solution: dividing the measurements by dotsize, to create a smaller matrix with bigger dots
                 */

                element.width = Number(element.width / element.dotsize).toFixed(0);
                element.height = Number(element.height / element.dotsize).toFixed(0);

                command += this.drawDataMatrix(element.pnfield, element.dotsize, element.quality, element.width, element.height, element.format, fieldtype)
                break;

              default:
                return false;
            }

          }
        }
      }
      return true
    });

    return command;
  }

  /**
   * This function returns the data that corresponds with the fieldname
   * If a variable name is found, we will loop through the available data, search for the variable and replace it with it's value if it's found.
   */
  getFieldData(field: any) {

    //match on any "%%....%%"
    var extractedVariable: any = String(field).match(/%%\w*%%/ig);

    //we first assume there are no matches, returndata will then be equal to the provided data.
    var finalString = field;

    var matched = false;

    //check for matches
    if (extractedVariable) {
      Object.keys(this.alldata).forEach((key: any, index) => {
        if (key == extractedVariable) {

          var newval = this.alldata[extractedVariable];

          if (String(extractedVariable) == "%%LAST_DELIVERY_DATE%%") {

            if (newval) {
              var date: any = new Date(newval)
            } else {
              var date: any = new Date() //print current month as last delivery date
            }

            if (date instanceof Date && !isNaN(date.valueOf())) {
              date = date.toISOString()
              if (moment) {
                newval = moment(date).format(this.dateformat);
              }
            } else {
              newval = ''
            }
          }

          finalString = field.replace(extractedVariable, newval);
          matched = true;
        }
      });

      if (!matched) {
        console.warn('No data available for "' + field + '", will print provided data.');
      }
    }

    if (String(extractedVariable) == "%%CURRENT_DATE%%") {

      if (moment) {
        var generatedDate = moment().format(this.dateformat);
      } else {
        var d = new Date();
        var month = (d.getMonth() < 10) ? ("0" + (d.getMonth() + 1)) : d.getMonth();
        var generatedDate = String(month) + String(d.getFullYear()).substring(2, 4);
        // console.warn('moment.js is not defined, date generated in lib: '+generatedDate);
      }

      finalString = field.replace(extractedVariable, generatedDate);
    }
    if (String(extractedVariable) === '%%SELLING_PRICE%%' || String(extractedVariable) === '%%SUGGESTED_RETAIL_PRICE%%') {
      if (finalString && this.alternative_price_notation) {
        var priceString = finalString.toString().replace(',', '.')
        if (!isNaN(priceString)) {
          finalString = String(" " + Number(priceString).toLocaleString())
          if (finalString.indexOf(',') === -1) {
            finalString = finalString + ",00"
          }
        }
      }
    }

    return finalString;
  }

  overrideVariables(request: any) {

    if (request.width !== undefined && request.width != this.width) {
      this.width = +(this.convertToDots(request.width))
      this.widthMm = +(request.width);
    }

    if (request.height !== undefined && request.height != this.height) {
      this.height = +(this.convertToDots(request.height))
      this.heightMm = +(request.height);
    }

    (request.dateformat !== undefined && request.dateformat != this.dateformat) ? this.dateformat = request.dateformat : null;
    (request.dpmm !== undefined && request.dpmm != this.dpmm) ? this.dpmm = Number(request.dpmm) : null;
    (request.encoding !== undefined && request.encoding != this.encoding) ? this.encoding = Number(request.encoding) : null;
    (request.inverted !== undefined && request.inverted != this.inverted) ? this.inverted = request.inverted : null;
    (request.labelleft !== undefined && request.labelleft != this.labelleft) ? this.labelleft = Number(request.labelleft) : null;
    (request.labeltop !== undefined && request.labeltop != this.labeltop) ? this.labeltop = Number(request.labeltop) : null;
    (request.media_darkness !== undefined && request.media_darkness != this.media_darkness) ? this.media_darkness = request.media_darkness : null;
    (request.media_type !== undefined && request.media_type != this.media_type) ? this.media_type = request.media_type : null;
    (request.offsetleft !== undefined && this.convertToDots(request.offsetleft) != this.offsetleft) ? this.offsetleft = Number(this.convertToDots(request.offsetleft)) : null;
    (request.offsettop !== undefined && this.convertToDots(request.offsettop) != this.offsettop) ? this.offsettop = Number(this.convertToDots(request.offsettop)) : null;
    (request.print_rate !== undefined && request.print_rate != this.print_rate) ? this.print_rate = request.print_rate : null;
    (request.layout_name !== undefined && request.layout_name != this.layout_name) ? this.layout_name = request.layout_name : null;
    (request.layout_storage !== undefined && request.layout_storage != this.layout_storage) ? this.layout_storage = request.layout_storage : null;
  }

  parseIfInteger(value: any) {
    return (typeof value === 'string' && value !== 'half' && value !== 'quarter') ? value = parseInt(value) : value;
  }

  createSubstring(data: any, max: any, suffix: any) {
    var data: any = String(data);
    var suffix: any = String(suffix);
    return (data.length > (max - suffix.length)) ? data.substring(0, (max - suffix.length)) + suffix : data;
  }

}

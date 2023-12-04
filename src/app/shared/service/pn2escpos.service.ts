import { TranslateService } from "@ngx-translate/core";

export class Pn2escposService {

  debug: any
  default_spacing: any
  divider_gutter: any
  drawerpin: any
  paper_cut: any;
  max_line_length_n: any;
  max_line_length_l: any;
  default_line_length: any;
  encoding: string;
  excerpt_suffix: any;
  replace_symbols: any;
  do_validate: any;
  symbols: { euro: string; '€': string; };
  syntaxname: string;
  syntax: any
  data: any;
  translateService: any;
  constructor(parameters: any = Object, translateService: TranslateService) {
    this.translateService = translateService;
    this.debug = (this.isDefined(parameters.debug)) ? parameters.debug : true;
    this.default_spacing = (this.isDefined(parameters.default_spacing)) ? parameters.default_spacing : 6;
    this.divider_gutter = (this.isDefined(parameters.divider_gutter)) ? parameters.divider_gutter : 4;
    this.drawerpin = (this.isDefined(parameters.drawerpin)) ? parameters.drawerpin : 2;
    this.paper_cut = (this.isDefined(parameters.paper_cut)) ? parameters.paper_cut : 2;
    this.max_line_length_n = (this.isDefined(parameters.linelength_n)) ? parameters.linelength_n : 48;
    this.max_line_length_l = (this.isDefined(parameters.linelength_l)) ? parameters.linelength_l : 24;
    this.default_line_length = this.max_line_length_n;
    this.encoding = (this.isDefined(parameters.encoding)) ? this.epSetEncoding(parameters.encoding) : this.epSetEncoding("CP1253"); //ESC t 16 = Cp1253
    this.excerpt_suffix = (this.isDefined(parameters.excerpt_suffix)) ? parameters.excerpt_suffix : "..";
    this.replace_symbols = (this.isDefined(parameters.replace_symbols)) ? parameters.replace_symbols : false
    this.do_validate = (this.isDefined(parameters.do_validate)) ? parameters.do_validate : false

    /**
     * Some symbols are not printed correctly and need to be replaced.
     * 1. Add symbol and value here
     * 2. Create an if-statement for this symbol in helperSanitizeCommand()
     */
    //var euro = this.epSetEncoding('CP1253_ALT') + this.helperSanitizeCommand("€")
    this.symbols = {
      'euro': '\x1b\x74\x10\x1B\x74\x13\xD5',
      '\u20AC': '\x1b\x74\x10\x1B\x74\x13\xD5',
      // '€': '\x1B\x74\x13\xD5'
      //
      //'€': cptable.utils.encode(1252, '€'),
      // 'euro': cptable.utils.encode(1253, '€'),
      // '\u20AC': cptable.utils.encode(1253, '€'),
      // '\u20ac': cptable.utils.encode(1253, '€'),
    };

    //1253

    //If Epson syntax doesn't work, try star
    if (parameters.syntax === "star") {
      this.syntaxname = 'star';
      this.syntax = this.syntaxStar;
    } else {
      this.syntaxname = 'epson';
      this.syntax = this.syntaxEpson;
    }
  }

  generate(template: any, dataObject: any) {
    if (this.helperValidateJSON(template)) {

      template = JSON.parse(template);

      if (this.helperValidateJSON(dataObject)) {
        this.data = JSON.parse(dataObject);
      }
      // console.log(this.data);

      var commandString = "";

      commandString += this.start();
      commandString += this.epBreak(Math.round(this.default_spacing / 2));

      //Loop over the actions defined in the template

      Object.keys(template).forEach((key: any) => {
        var action: any = this.createObjectFromTemplateLine(template[key]);
        // console.log({action});
        if (action.do) {
          //this.clog('EXECUTING {"'+action.do+'":"'+action.data+'"}')
          let a;
          if (action.if) {
            if (this.checkConditions(action.if, this.data)) {
              a = this.doAction(action, key)
              // console.log('after process if', a)
              commandString += a;
            }
          } else {
            a = this.doAction(action, key)
            // console.log('after process else', a)
            commandString += a;
          }

        } else {
          this.cwarn('UNKNOWN: ' + action.do, action)
          return false;
        }
        return;
      });

      // debug code for encodings
      // var encodings = [
      // 	"CP437",
      // 	"CP850",
      // 	"CP860",
      // 	"CP863",
      // 	"CP865",
      // 	"CP1251",
      // 	"CP866",
      // 	"MACCYRILLIC",
      // 	"CP775",
      // 	"CP1253",
      // 	"CP737",
      // 	"CP857",
      // 	"ISO8859_9",
      // 	"CP864",
      // 	"CP862",
      // 	"ISO8859_2",
      // 	"CP1253_ALT",
      // 	"CP1250",
      // 	"CP858",
      // 	"CP1254",
      // 	"CP737_ALT",
      // 	"CP1257",
      // 	"CP847",
      // 	"CP885",
      // 	"CP857_ALT",
      // 	"CP1250_ALT",
      // 	"CP775_ALT",
      // 	"CP1254_ALT",
      // 	"CP1256",
      // 	"CP1258",
      // 	"ISO8859_2_ALT",
      // 	"ISO8859_3",
      // 	"ISO8859_4",
      // 	"ISO8859_5",
      // 	"ISO8859_6",
      // 	"ISO8859_7",
      // 	"ISO8859_8",
      // 	"ISO8859_9_ALT",
      // 	"ISO8859_15",
      // 	"CP856",
      // 	"CP874"]

      // for(var c in encodings) {
      // 	commandString += this.epSetEncoding(encodings[c]) + encodings[c] + " : " + this.helperSanitizeCommand("€") + this.epBreak()
      // }


      commandString += this.finish(this.paper_cut);

      return commandString;

    } else {
      this.cerror('The provided JSON is invalid', template);
      return false;
    }
  }

  addForeach(command: any) {

    var foreachString = "";
    var requestedData = this.data[command.data];

    //The value passed to the foreach-action should exist in the data array
    if (typeof requestedData !== 'undefined') {

      //the foreach data object should contain child objects
      if (typeof Object.values(requestedData)[0] == 'object') {
        for (let a = 0; a < requestedData.length; a++) {

          //adding a blank line between items
          if (a > 0 && a < (requestedData.length - 1) && command.blankline == true)
            foreachString += this.epBreak();

          //looping over the actions in 'template'
          for (let i = 0; i < command.template.length; i++) {
            var action: any = this.createObjectFromTemplateLine(command.template[i], requestedData[a]);

            action.inforeach = true;

            if (typeof command.columns !== 'undefined') {
              if (typeof command.columns[i] !== 'undefined') {

                var colwidthsum = 0;

                for (let a = 0; a < command.columns.length; a++) {
                  colwidthsum += command.columns[i];
                }

                if (colwidthsum == this.default_line_length) {
                  this.cwarn('The sum of the columns in your foreach equal the default line length. This should be equal to the default line length minus the number of columns)')
                }

                action.columnwidth = command.columns[i];
                action.columnpos = i;
                action.colcount = command.columns.length;

              } else {
                action.column = 0;
              }
            }

            if (action.if) {
              if (this.checkConditions(action.if, JSON.stringify(requestedData[a]))) {
                foreachString += this.doAction(action, i)
              }
            } else {
              foreachString += this.doAction(action, i);
            }
          }
        }
      } else {
        this.cerror('No objects found in "' + command.data + '".');
      }

    } else {
      this.cerror("No data found for " + command.data);
    }

    return foreachString;
  }

  addBarcodeLeft(data: any) {
    return this.addBarcode(data, "L")
  }

  addBarcodeRight(data: any) {
    return this.addBarcode(data, "R")
  }

  addBarcode(data: any, alignment = "C") {

    let inp = String(this.replaceVariables(data))

    let align_barcode = ""

    switch (alignment) {
      case "L":
        align_barcode = "\x00"
        break;

      case "R":
        align_barcode = "\x02"
        break;

      default:
        align_barcode = "\x01"
        break;
    }

    let barcode_command = "\x1b\x40\x1ba" + align_barcode + "\x1dh\x40\x1dw\x02\x1dH\x00\x1dkH" + String.fromCharCode(inp.length) + "" + inp + "\x00"

    //reset alignment to left
    barcode_command += this.syntax.TXT_ALIGN_LT
    barcode_command += this.epBreak();
    barcode_command += this.encoding;

    return barcode_command
  }

  addQrCode(value: any) {

    var qr = value;
    qr = this.replaceVariables(qr);
    var dots = '\x09';

    // Some proprietary size calculation
    var qrLength = qr.length + 3;
    var size1 = String.fromCharCode(qrLength % 256);
    var size0 = String.fromCharCode(Math.floor(qrLength / 256));

    var data = [
      // Some text and a few line feeds to make sure the initiation and first line are coming through
      //'\x1B' + 
      // <!-- BEGIN QR DATA -->
      '\x1D' + '\x28' + '\x6B' + '\x04' + '\x00' + '\x31' + '\x41' + '\x32' + '\x00' + // <Function 165> select the model (model 2 is widely supported)
      '\x1D' + '\x28' + '\x6B' + '\x03' + '\x00' + '\x31' + '\x43' + dots + // <Function 167> set the size of the module
      '\x1D' + '\x28' + '\x6B' + '\x03' + '\x00' + '\x31' + '\x45' + '\x30' +  // <Function 169> select level of error correction (48,49,50,51) printer-dependent
      '\x1D' + '\x28' + '\x6B' + size1 + size0 + '\x31' + '\x50' + '\x30' + qr +// <Function 080> send your data (testing 123) to the image storage area in the printer
      '\x1D' + '\x28' + '\x6B' + '\x03' + '\x00' + '\x31' + '\x51' + '\x30' + // <Function 081> print the symbol data in the symbol storage area
      '\x1D' + '\x28' + '\x6B' + '\x03' + '\x00' + '\x31' + '\x52' + '\x30'// <Function 082> Transmit the size information of the symbol data in the symbol storage area
      // <!-- END QR DATA -->
      //+ '\x0A' + '\x0A'
    ];

    return data;
  }

  addLogo(align = "C", nv = false) {

    var logo = "";

    if (nv) {
      logo += this.epBreak();
      logo += '\x1c\x70\x01\x00' // = "FS p 1 3"
      logo += this.epBreak()
      return logo
    } else {
      logo += this.epBreak();
      logo += this.syntax.TXT_ALIGN_CT;

      if (align == "L") {
        logo += this.syntax.TXT_ALIGN_LT;
      }

      if (align == "R") {
        logo += this.syntax.TXT_ALIGN_RT;
      }

      //shows the logo stored at 32,32 (https://loyverse.town/topic/1165-how-to-print-graphical-logo-on-epson-tm-t88v/)
      logo += '\x1D\x28\x4C\x06\x00\x30\x45\x20\x20\x01\x01';

      logo += this.epBreak()

      //revert alignment
      if (align !== "L") {
        logo += this.syntax.TXT_ALIGN_LT;
      }

      return logo;
    }
  }

  addDivider(char: any) {

    var divider = "";
    var gutter = this.divider_gutter;
    var width = this.default_line_length - (gutter * 2);

    for (let a = 0; a < gutter; a++) {
      divider += " ";
    }

    for (let b = 0; b < width; b++) {
      divider += char;
    }

    for (let a = 0; a < gutter; a++) {
      divider += " ";
    }

    divider += this.epBreak();

    return divider;
  }

  doAction(command: any, currentKey: any) {

    switch (command.do) {

      case "align":
        return this.epAlign(command.data)

      case "bold":
        return this.epBold(command.data)

      case "size":
        return this.epSize(command.data, currentKey)

      case "inverted":
        return this.epInverted(command.data)

      case "underlined":
        return this.epUnderlined(command.data)

      case "barcode":
        return this.epBreak() + this.addBarcode(command.data)

      case "barcode_left":
        return this.epBreak() + this.addBarcodeLeft(command.data)

      case "barcode_right":
        return this.epBreak() + this.addBarcodeRight(command.data)

      case "qrcode":
        return this.addQrCode(command.data)

      case "nv_logo":
        return this.addLogo(command, true)

      case "logo":
        return this.addLogo(command)

      case "foreach":
        return this.addForeach(command)

      case "text":
        return this.addText(command)

      case "line":
        return this.addText(command, true)

      case "break":
        return this.epBreak(command.data)

      case "divider":
        return this.addDivider(command.data)

      case "opendrawer":
        this.drawerpin = parseInt(command.data);
        return "";

      case "measureprinter":
        return this.printMeasuringReceipt();

      default:
        this.cerror(command.do + '" is not a valid action', command);
        return "";
    }
  }

  replaceVariables(commandText: any, itemData = null, colpos = 0, colwidth = 0, colcount = 0, pullright = false) {

    //match on any text between "[[" and "]]"
    var extractedVariables = commandText.match(/\[\[(.*?)]]/ig); //includes child variables
    var multiple_vars_in_column = false;

    //in a foreach, the data is provided. If not provided, the parent variables will be searched
    if (itemData) {
      var providedData: any = itemData;
    } else {
      var providedData: any = this.data;
    }

    //we first assume there are no matches, the return data will then be equal to the provided data.
    var finalString = commandText;

    if (extractedVariables !== null) {

      /**
       * if there is more than one variable in a column, justification should not
       * be applied to the variables individually but only to the text as a whole
       */
      if (extractedVariables.length > 1) {
        multiple_vars_in_column = true;
      }

      //for each variable, we loop over the data array to find a match
      for (let a = 0; a < extractedVariables.length; a++) {

        var currentMatch = extractedVariables[a];
        var placeholder = "";
        var maxlength = 0;

        //Finding more than 2 "[" means there's a variable not closed properly
        if (currentMatch.match(/\[/g).length == 2) {

          //remove spaces
          currentMatch = currentMatch.replace(/\s/g, '').replace(' ', '');

          //remove brackets
          let variableStringFilteredIndex0 = currentMatch.replace('[[', '').replace(']]', '');
          const hasFormat = variableStringFilteredIndex0.includes('|');
          let aFormatParts;
          let format;
          if(hasFormat) {
            aFormatParts = variableStringFilteredIndex0.split('|');
            variableStringFilteredIndex0 = aFormatParts[0]
            format = aFormatParts[1];
          }
          
          //check for "|"
          if (commandText.match(/~/g) && commandText.match(/~/g).length > -1) {
            var variableParameters = commandText.split('~');
            //a variable can contain a placeholder as well as a maximum. To extract both, we assign it to the proper parameter based on its type.
            //Disadvantage; placeholder cannot consist of only numbers, for that will not pass 'isNaN'
            for (let i = 1; i < variableParameters.length; i++) {

              const parameter = variableParameters[i];
              if (isNaN(parameter)) {
                if (parameter.match("'") && parameter.match("'").length > -1) {
                  placeholder = parameter.replace(/[']/g, "");
                } else {
                  placeholder = parameter;
                }
              } else {
                maxlength = parseInt(parameter);
              }
            }

            variableStringFilteredIndex0 = variableParameters[0];
          }

          var variableStringFilteredIndex1: String | undefined;
          var variableStringFilteredIndex2: String | undefined;
          //Detect nested variables, e.g. {shop.address}
          if (variableStringFilteredIndex0 && variableStringFilteredIndex0.match(/\./g)) {
            if (variableStringFilteredIndex0.match(/\./g).length <= 3) {
              var parts = variableStringFilteredIndex0.split('.');
              providedData = this.data[parts[0]];
              variableStringFilteredIndex0 = parts[1];
              variableStringFilteredIndex1 = parts[2];
              variableStringFilteredIndex2 = parts[3];
            } else {
              this.cerror('Cannot use "' + variableStringFilteredIndex0 + '", nesting is limited to three level', variableStringFilteredIndex0);
            }
          }

          var matched = false;
          var newtext: any = "";
          
          
          if (providedData[variableStringFilteredIndex0]) { //a match on key
            if (String(providedData[variableStringFilteredIndex0]).length > 0) { // ..there's data
              newtext = providedData[variableStringFilteredIndex0];
              
              if (typeof (variableStringFilteredIndex1) == 'string' && String(providedData[variableStringFilteredIndex0][variableStringFilteredIndex1]).length > 0) {
                if (typeof (variableStringFilteredIndex2) == 'string' && providedData[variableStringFilteredIndex0][variableStringFilteredIndex1][variableStringFilteredIndex2]) {
                  newtext = providedData[variableStringFilteredIndex0][variableStringFilteredIndex1][variableStringFilteredIndex2];
                  
                } else {
                  newtext = providedData[variableStringFilteredIndex0][variableStringFilteredIndex1];
                  
                }
              }

              if (!multiple_vars_in_column)
                newtext = this.helperJustifyInColumn(newtext, colcount, colwidth, colpos, pullright);

              // finalString = finalString.replace(currentMatch, newtext, 0);
              matched = true;
            } else {
              if (!multiple_vars_in_column)
                finalString = this.helperJustifyInColumn(finalString, colcount, colwidth, colpos, pullright);

              if (placeholder)
                finalString = placeholder;

            }
          } else if (variableStringFilteredIndex0.startsWith("__")) {
            newtext = this.translateService.instant(variableStringFilteredIndex0.substring(2));
            matched = true;
            
          }
          if(hasFormat) {
            if(format=='invert') {
              newtext = this.epInverted(true) + newtext + this.epInverted(false);
            }
          }
          finalString = finalString.replace(currentMatch, newtext, 0);

          // backup code for some time

          // Object.keys(providedData).forEach((key, index) => {
          //   if (key == variableStringFilteredIndex0) { //a match on key
          //     if (String(providedData[variableStringFilteredIndex0]).length > 0) { // ..there's data
          //       newtext = providedData[variableStringFilteredIndex0];
          //       console.log(502, { newtext, variableStringFilteredIndex0 })
          //       if (typeof (variableStringFilteredIndex1) == 'string' && String(providedData[variableStringFilteredIndex0][variableStringFilteredIndex1]).length > 0) {
          //         if (typeof (variableStringFilteredIndex2) == 'string' && providedData[variableStringFilteredIndex0][variableStringFilteredIndex1][variableStringFilteredIndex2]) {
          //           newtext = providedData[variableStringFilteredIndex0][variableStringFilteredIndex1][variableStringFilteredIndex2];
          //           console.log(506, { newtext, variableStringFilteredIndex0, variableStringFilteredIndex1, variableStringFilteredIndex2 })
          //         } else {
          //           newtext = providedData[variableStringFilteredIndex0][variableStringFilteredIndex1];
          //           console.log(509, { newtext, variableStringFilteredIndex0, variableStringFilteredIndex1 })
          //         }
          //       }

          //       if (!multiple_vars_in_column)
          //         newtext = this.helperJustifyInColumn(newtext, colcount, colwidth, colpos, pullright);

          //       finalString = finalString.replace(currentMatch, newtext, 0);

          //       matched = true;
          //     } else if (variableStringFilteredIndex0.startsWith("__")) {
          //       newtext = this.translateService.instant(variableStringFilteredIndex0.substring(2));
          //     }
          //     else {
          //       if (!multiple_vars_in_column)
          //         finalString = this.helperJustifyInColumn(finalString, colcount, colwidth, colpos, pullright);

          //       if (placeholder)
          //         finalString = placeholder;

          //       finalString = finalString.replace(currentMatch, newtext, 0);
          //     }
          //   }
          // });

          if (!matched) {
            if (placeholder) {
              this.clog('"' + variableStringFilteredIndex0 + '" replaced by placeholder "' + placeholder + '"')
            } else {
              this.cwarn('"' + finalString + '" could not be matched with the provided data.');
            }

            if (!multiple_vars_in_column)
              finalString = this.helperJustifyInColumn("", colcount, colwidth, colpos, pullright);
          }

        } else {
          this.cerror('A variable in "' + currentMatch + '" is not closed properly.', currentMatch)
        }
      }
    } else {
      if (colwidth !== 0) {
        if (!multiple_vars_in_column)
          finalString = this.helperJustifyInColumn(finalString, colcount, colwidth, colpos, pullright);
      }
    }

    if (multiple_vars_in_column) {
      finalString = this.helperJustifyInColumn(finalString, colcount, colwidth, colpos, pullright, true);
    }

    return finalString;
  }

  helperJustifyInColumn(newtext: any = null, colcount: any, colwidth: any, colpos: any, pullright = false, multiple_vars_in_column = false) {

    if (newtext == null || newtext.length == 0) {
      newtext = "";
      for (let i = 0; i < colwidth; i++) {
        newtext += " ";
      }
    } else {
      if (colwidth > 0) {
        if (newtext.length <= colwidth) {

          var spacesneeded = colwidth - newtext.length;
          var extra = ""

          for (let i = 0; i < spacesneeded; i++) {
            extra += " ";
          }

          newtext = (pullright) ? String(extra + newtext) : String(newtext + extra);

        } else {
          if (newtext.substr(newtext.length - 1) !== " ") {
            newtext = this.helperSubstring(newtext, colwidth);
          }
        }
      }
    }

    if (colpos < (colcount - 1)) {
      newtext += " ";
    }

    if (multiple_vars_in_column == true) {
      newtext += " ";
    }

    return newtext;
  }

  addText(command: any, breakafter = false) {

    var text = "";
    var dataString = String(command.data);

    //to split the text into columns, it must be a lin and not in a foreach
    if (breakafter && dataString.indexOf('|') > -1 && typeof command.inforeach == 'undefined') {

      //split the line into parts and remove empty ones
      var parts = dataString.split('|').filter(function (el) {
        return el != "";
      });

      var table = [];

      if (parts.length > 0) {
        var table = [];
        for (let i = 0; i < parts.length; i++) {
          var col = parts[i];
          var nr_of_cols = parts.length;
          var colwidth = Math.floor((this.default_line_length - (nr_of_cols - 1)) / nr_of_cols);

          col = this.replaceVariables(col, null, i, colwidth, nr_of_cols)

          table.push(col);
        }
        dataString = table.join('');
      }
    } else {
      dataString = this.replaceVariables(dataString, command.source, command.columnpos, command.columnwidth, command.colcount, command.pullright)
    }

    if (dataString.indexOf('<<>>') > -1) {
      dataString = this.helperJustifyString(dataString, command.startat);
    }

    //Don't apply word breaks if the data to be replaced is [[ticket]] (CCV Receipts)
    if (dataString.toString().length > this.default_line_length && command.data !== '[[ticket]]') {
      dataString = this.helperWordbreak(dataString, (this.default_line_length - 1));
      this.clog('"Wordbreak applied, result: "' + JSON.stringify(dataString) + '"')
    }

    text += dataString;

    if (breakafter && text.length != 0)
      text += this.epBreak();

    if (this.replace_symbols) {
      return this.helperSanitizeCommand(text);
    } else {
      return text
    }
  }

  start() {
    var start = this.epStart();
    start += this.encoding;
    return start;
  }

  finish(cut = 2) {

    var cut_syntax = "";

    switch (cut) {
      case 1:
        cut_syntax = '\x1B\x69'; // cut paper (old syntax)
        break;

      case 2:
        cut_syntax = '\x1D\x56\x00' // full cut (new syntax)
        break;

      case 3:
        cut_syntax = '\x1D\x56\x30' // full cut (new syntax)
        break;

      case 4:
        cut_syntax = '\x1D\x56\x01' // partial cut (new syntax)
        break;

      case 5:
        cut_syntax = '\x1D\x56\x31' // partial cut (new syntax)
        break;

      default:
        if (cut) {
          this.cwarn('Wrong cut syntax, default used')
        }
        cut_syntax = '\x1B\x69'; // cut paper (old syntax)
        break;
    }

    var finishing = "";

    finishing += this.epOpenDrawer();
    finishing += this.epBreak(this.default_spacing);
    finishing += cut_syntax;

    return finishing;
  }

  helperSanitizeCommand(string: any) {

    for (const [key, value] of Object.entries(this.symbols)) {
      if (string.indexOf(key) > -1) {
        string = string.replaceAll(key, value);
      }
    }

    return string;
  }

  helperJustifyString(dataString: any, startat: any) {

    //default_line_length is automatically changed when the text size is changed
    var current_line_length = this.default_line_length;

    if (dataString.indexOf('<<>>') > -1) {
      var parts = dataString.split('<<>>');
    }

    var partLeft = String(parts[0]).trim();
    var partRight = String(parts[1]).trim();

    var providedline_length = (partLeft.length + partRight.length);

    if (providedline_length < current_line_length) {

      var margin = current_line_length - providedline_length;
      var justified = partLeft;

      for (let a = 0; a < margin; a++) {
        justified += " ";
      }

      justified += partRight;

    } else {
      //justified = partLeft.substring(0, (current_line_length - (partRight.length + 3))) + '.. ' + partRight;
      justified = partLeft + this.epBreak() + partRight;
    }

    return justified;
  }

  helperSubstring(text: any, max: any = 0, startat: any = 0) {

    if (max != 0 && text.length > (max - 2)) {
      return text.substring(0, (max - 2)) + this.excerpt_suffix;
    } else {
      return text;
    }
  }

  helperTestWhite(x: any) {
    var white = new RegExp(/^\s$/);
    return white.test(x.charAt(0));
  }

  helperWordbreak(str: any, maxWidth: any) {
    var newLineStr = "\n";
    var done = false;
    var res = '';
    while (str.length > maxWidth) {
      var found = false;
      // Inserts new line at first whitespace of the line
      for (let i = maxWidth - 1; i >= 0; i--) {
        if (this.helperTestWhite(str.charAt(i))) {
          res = res + [str.slice(0, i), newLineStr].join('');
          str = str.slice(i + 1);
          found = true;
          break;
        }
      }
      // Inserts new line at maxWidth position, the word is too long to wrap
      if (!found) {
        res += [str.slice(0, maxWidth), newLineStr].join('');
        str = str.slice(maxWidth);
      }

    }

    return res + str;
  }

  createObjectFromTemplateLine(templateline: any, requestedData = null) {

    var action: any = new Object();

    var action_keys: any = Object.keys(templateline);
    var action_vals: any = Object.values(templateline);

    action.do = Object.keys(templateline)[0];
    action.data = Object.values(templateline)[0];

    if (this.do_validate !== true) {
      delete action.if
    } else {
      if (action_keys[1] == "if") {
        action.if = action_vals[1]
      }
    }

    if (requestedData)
      action.source = requestedData;

    for (let i = 1; i < action_keys.length; i++) {
      if (action_keys[i] == "template") {
        if (typeof action_vals[i][0] !== 'object') {
          this.cerror("The template of the foreach is undefined.", action);
        }
      }
      action[action_keys[i]] = action_vals[i];
    }

    return action;
  }

  checkConditions(conditions: any, dataSourceObject: any) {
    // dataSourceObject = JSON.parse(dataSourceObject);

    var item = dataSourceObject; //Used for the eval() function

    if (conditions && conditions !== "" && !conditions.startsWith('item') && !conditions.startsWith('!item')) {
      throw String('Conditions should be preceded by "item.", so this should something like item.' + conditions)
    }

    try {
      if (eval(conditions)) {
        return true
      } else {
        return false
      }
    } catch (e) {
      console.error(e)
      // throw e
      return false
    }
  }

  helperValidateJSON(json: any) {
    try {
      if (json) {
        JSON.parse(json);
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  epStart() {
    return this.epEscape() + '\x40';
  }

  epEscape() {
    return "\x1B";
  }

  epAlign(alignment = "left") {

    switch (alignment) {

      case "left":
        return this.syntax.TXT_ALIGN_LT;

      case "center":
        return this.syntax.TXT_ALIGN_CT;

      case "right":
        return this.syntax.TXT_ALIGN_RT;

      default: //left
        if (alignment) {
          this.cwarn('Wrong alignment syntaxt, default used', alignment)
        }

        return this.syntax.TXT_ALIGN_LT;
    }
  }

  epBold(bold = false) {
    return (bold == true) ? this.syntax.TXT_BOLD_ON : this.syntax.TXT_BOLD_OFF;
  }

  epInverted(inverted = false) {
    return (inverted == true) ? this.syntax.TXT_INVERT_ON : this.syntax.TXT_INVERT_OFF;
  }

  epSize(size = "normal", currentKey?: any) {

    switch (size) {
      case "normal":
        this.default_line_length = this.max_line_length_n;
        return this.syntax.TXT_NORMAL;

      case "large":
        this.default_line_length = this.max_line_length_l;
        return '\x1D\x21\x11';

      default: //normal
        if (size) {
          this.cwarn('Wrong syntax, default used', size)
        }
        return '\x1D\x21\x00';
    }
  }

  epBreak(breaks = 1) {
    if (breaks > 1) {
      var result = ""
      for (let i = 0; i < breaks; i++) {
        result += '\x0A';
      }
    } else {
      var result = '\x0A';
    }

    return result;
  }

  epUnderlined(underline = false) {
    return (underline == true) ? this.syntax.TXT_UNDERL_ON : this.syntax.TXT_UNDERL_OFF;
  }

  /**
   * epOpenDrawer 
   * 
   * This function sets this.drawerpin to 2, 5, or empty.
   * The finish() function will append this to the printcommand.
   */
  epOpenDrawer(pin = null) {

    var pinconnecter = (pin !== null) ? pin : this.drawerpin;

    if (pinconnecter == 5) {
      var drawercommand = '\x1b\x70\x01';
    } else if (pinconnecter == 2) {
      var drawercommand = '\x10\x14\x01\x00\x05';
    } else {
      var drawercommand = '';
    }

    return drawercommand;
    // Generate Pulse to kick-out cash drawer**
    // **for legacy drawer cable CD-005A.  Research before using.
    // see also http://keyhut.com/popopen4.htm
    // '\x10' + '\x14' + '\x01' + '\x00' + '\x05';

    //NOT TESTED:
    //PIN2[ \x1b, \x70, \x00 ]		 
    //PIN5			[ \x1b, \x70, \x01 ]
  }

  epSetEncoding(id: any) {
    var encoding_start = "\x1b" + "\x74";
    var encoding_char = "";

    switch (id) {

      case "CP437":
        encoding_char = "\x00";
        break;

      case "CP850":
        encoding_char = "\x02";
        break;

      case "CP860":
        encoding_char = "\x03";
        break;

      case "CP863":
        encoding_char = "\x04";
        break;

      case "CP865":
        encoding_char = "\x05";
        break;

      case "CP1251":
        encoding_char = "\x06";
        break;

      case "CP866":
        encoding_char = "\x07";
        break;

      case "MACCYRILLIC":
        encoding_char = "\x08";
        break;

      case "CP775":
        encoding_char = "\x09";
        break;

      case "CP1253":
        encoding_char = "\x10";
        break;

      case "CP737":
        encoding_char = "\x11";
        break;

      case "CP857":
        encoding_char = "\x12";
        break;

      case "ISO8859_9":
        encoding_char = "\x13";
        break;

      case "CP864":
        encoding_char = "\x14";
        break;

      case "CP862":
        encoding_char = "\x15";
        break;

      case "ISO8859_2":
        encoding_char = "\x16";
        break;

      case "CP1253_ALT":
        encoding_char = "\x17";
        break;

      case "CP1250":
        encoding_char = "\x18";
        break;

      case "CP858":
        encoding_char = "\x19";
        break;

      case "CP1254":
        encoding_char = "\x20";
        break;

      case "CP737_ALT":
        encoding_char = "\x24";
        break;

      case "CP1257":
        encoding_char = "\x25";
        break;

      case "CP847":
        encoding_char = "\x26";
        break;

      case "CP885":
        encoding_char = "\x28";
        break;

      case "CP857_ALT":
        encoding_char = "\x29";
        break;

      case "CP1250_ALT":
        encoding_char = "\x30";
        break;

      case "CP775_ALT":
        encoding_char = "\x31";
        break;

      case "CP1254_ALT":
        encoding_char = "\x32";
        break;

      case "CP1256":
        encoding_char = "\x34";
        break;

      case "CP1258":
        encoding_char = "\x35";
        break;

      case "ISO8859_2_ALT":
        encoding_char = "\x36";
        break;

      case "ISO8859_3":
        encoding_char = "\x37";
        break;

      case "ISO8859_4":
        encoding_char = "\x38";
        break;

      case "ISO8859_5":
        encoding_char = "\x39";
        break;

      case "ISO8859_6":
        encoding_char = "\x40";
        break;

      case "ISO8859_7":
        encoding_char = "\x41";
        break;

      case "ISO8859_8":
        encoding_char = "\x42";
        break;

      case "ISO8859_9_ALT":
        encoding_char = "\x43";
        break;

      case "ISO8859_15":
        encoding_char = "\x44";
        break;

      case "CP856":
        encoding_char = "\x47";
        break;

      case "CP874":
        encoding_char = "\x47";
        break;

      default:
        encoding_char = "\x10";
        break;
    }

    return encoding_start + encoding_char;
  }

  printMeasuringReceipt() {

    return this.start()
      + ' 1. What is the last number on the first line?'
      + this.epBreak()
      + '2. How many dashes are there on the right side of this number?'
      + this.epBreak(2)
      + 'Normal text: '
      + this.epBreak()
      + '.........1.........2.........3.........4.........5.........6.........7.........8'
      + this.epBreak()
      + 'Large text: '
      + this.epSize('large')
      + this.epBreak()
      + '.........1.........2.........3.........4'
      + this.epSize('normal')
      + this.epBreak(this.default_spacing)
      + this.finish(this.paper_cut);
  }

  isDefined(obj: any) {
    return typeof obj !== 'undefined';
  }

  clog(message: any, dataObject?: any) {
    this.outputLogging('log', message, dataObject)
  }
  cerror(message: any, dataObject?: any) {
    this.outputLogging('error', message, dataObject)
  }
  cwarn(message: any, dataObject?: any) {
    this.outputLogging('warning', message, dataObject)
  }

  outputLogging(type = "log", message = null, dataObject = null) {
    if (message) {
      switch (type) {
        case "log":
          if (this.debug) {
            if (dataObject) { console.log(dataObject) }
          }
          break;

        case "warning":
          if (this.debug) {
            console.warn("WARNING: " + message)
            if (dataObject) { console.warn(dataObject) }
          }
          break;

        case "error":
          console.error("ERROR: " + message)

          if (dataObject) { console.error(dataObject) }
          break;

        default:
          if (this.debug) {
            if (dataObject) { console.log(dataObject) }
          }
          break;
      }
    }
  }

  syntaxEpson = {
    "PAPER_FULL_CUT": "\x1d\x56\x00",  // Full cut paper
    "PAPER_PART_CUT": "\x1d\x56\x01",  // Partial cut paper
    "QRCODE_CELLSIZE_1": "\x1d\x28\x6b\x03\x00\x31\x43",  // Cell size 1
    "QRCODE_CELLSIZE_2": "\x1d\x28\x6b\x03\x00\x31\x43\x02",  // Cell size 2
    "QRCODE_CELLSIZE_3": "\x1d\x28\x6b\x03\x00\x31\x43\x03",  // Cell size 3
    "QRCODE_CELLSIZE_4": "\x1d\x28\x6b\x03\x00\x31\x43\x04",  // Cell size 4
    "QRCODE_CELLSIZE_5": "\x1d\x28\x6b\x03\x00\x31\x43\x05",  // Cell size 5
    "QRCODE_CELLSIZE_6": "\x1d\x28\x6b\x03\x00\x31\x43\x06",  // Cell size 6
    "QRCODE_CELLSIZE_7": "\x1d\x28\x6b\x03\x00\x31\x43\x07",  // Cell size 7
    "QRCODE_CELLSIZE_8": "\x1d\x28\x6b\x03\x00\x31\x43\x08",  // Cell size 8
    "QRCODE_CORRECTION_H": "\x1d\x28\x6b\x03\x00\x31\x45\x33",  // Correction level: H - 30%
    "QRCODE_CORRECTION_L": "\x1d\x28\x6b\x03\x00\x31\x45\x30",  // Correction level: L - 7%
    "QRCODE_CORRECTION_M": "\x1d\x28\x6b\x03\x00\x31\x45\x31",  // Correction level: M - 15%
    "QRCODE_CORRECTION_Q": "\x1d\x28\x6b\x03\x00\x31\x45\x32",  // Correction level: Q - 25%
    "QRCODE_MODEL1": "\x1d\x28\x6b\x04\x00\x31\x41\x31\x00",  // Model 1
    "QRCODE_MODEL2": "\x1d\x28\x6b\x04\x00\x31\x41\x32\x00",  // Model 2
    "QRCODE_PRINT": "\x1d\x28\x6b\x03\x00\x31\x51\x30",  // Print QR code
    "TXT_2HEIGHT": "\x1b\x21\x10",  // Double height text
    "TXT_2WIDTH": "\x1b\x21\x20",  // Double width text
    "TXT_4SQUARE": "\x1b\x21\x30",  // Quad area text
    "TXT_ALIGN_CT": "\x1b\x61\x01",  // Centering
    "TXT_ALIGN_LT": "\x1b\x61\x00",  // Left justification
    "TXT_ALIGN_RT": "\x1b\x61\x02",  // Right justification
    "TXT_BOLD_OFF": "\x1b\x45\x00",  // Bold font OFF
    "TXT_BOLD_ON": "\x1b\x45\x01",  // Bold font ON
    "TXT_FONT_A": "\x1b\x4d\x00",  // Font type A
    "TXT_FONT_B": "\x1b\x4d\x01",  // Font type B
    "TXT_INVERT_OFF": "\x1d\x42\x00",  // Invert font OFF (eg. white background)
    "TXT_INVERT_ON": "\x1d\x42\x01",  // Invert font ON (eg. black background)
    "TXT_NORMAL": "\x1b\x21\x00",  // Normal text
    "TXT_LARGE": "\x1b\x21\x11",  // Normal text
    "TXT_UNDERL2_ON": "\x1b\x2d\x02",  // Underline font 2-dot ON
    "TXT_UNDERL_OFF": "\x1b\x2d\x00",  // Underline font OFF
    "TXT_UNDERL_ON": "\x1b\x2d\x01",  // Underline font 1-dot ON
  }

  syntaxStar = {
    "PAPER_FULL_CUT": "\x1b\x64\x02",  // Full cut paper //STAR
    "PAPER_PART_CUT": "\x1b\x64\x03",  // Partial cut paper //STAR
    "QRCODE_CELLSIZE": "\x1b\x1d\x79\x53\x32", // Cell size 1 //STAR
    "QRCODE_CORRECTION_H": "\x1b\x1d\x79\x53\x31\x03",  // Correction level: H - 30% //STAR
    "QRCODE_CORRECTION_L": "\x1b\x1d\x79\x53\x31\x00",  // Correction level: L - 7% //STAR
    "QRCODE_CORRECTION_M": "\x1b\x1d\x79\x53\x31\x01",  // Correction level: M - 15% //STAR
    "QRCODE_CORRECTION_Q": "\x1b\x1d\x79\x53\x31\x02",  // Correction level: Q - 25% //STAR
    "QRCODE_MODEL1": "\x1b\x1d\x79\x53\x30\x01",  // Model 1 //STAR
    "QRCODE_MODEL2": "\x1b\x1d\x79\x53\x30\x02",  // Model 2 //STAR
    "QRCODE_PRINT": "\x1b\x1d\x79\x50",  // Print QR code //STAR
    "TXT_2HEIGHT": "\x1b\x69\x01\x00",  // Double height text //STAR
    "TXT_2WIDTH": "\x1b\x69\x00\x01",  // Double width text //STAR
    "TXT_4SQUARE": "\x1b\x69\x01\x01",  // Quad area text //STAR
    "TXT_ALIGN_CT": "\x1b\x1d\x61\x01",  // Centering //STAR
    "TXT_ALIGN_LT": "\x1b\x1d\x61\x00",  // Left justification //STAR
    "TXT_ALIGN_RT": "\x1b\x1d\x61\x02",  // Right justification //STAR
    "TXT_BOLD_OFF": "\x1b\x46",  // Bold font OFF //STAR
    "TXT_BOLD_ON": "\x1b\x45",  // Bold font ON //STAR
    "TXT_FONT_A": "\x1b\x1e\x46\x00",  // Font type A //STAR
    "TXT_FONT_B": "\x1b\x1e\x46\x01",  // Font type B //STAR
    "TXT_INVERT_OFF": "\x1b\x35",  // Invert font OFF (eg. white background) //STAR
    "TXT_INVERT_ON": "\x1b\x34",  // Invert font ON (eg. black background) //STAR
    "TXT_NORMAL": "\x1b\x69\x00\x00",  // Normal text //STAR
    "TXT_LARGE": "\x1b\x21\x11", //EPSON syntax, not sure if it works
    "TXT_UNDERL2_ON": "\x1b\x2d\x02",  // Underline font 2-dot ON //STAR
    "TXT_UNDERL_OFF": "\x1b\x2d\x00",  // Underline font OFF //STAR
    "TXT_UNDERL_ON": "\x1b\x2d\x01",  // Underline font 1-dot ON //STAR
  }

}

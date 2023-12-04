
export class TSCLabelService {

	static knownElements = ['rectangle', 'circle','barcode','datamatrix','text','scalabletext'];
	tspl_iID:any;
	tspl_iDpi:any;
	tspl_iDefaultFontSize:any;
	tspl_sName:any;
	tspl_iMediaDarkness:any;
	tspl_iHeightMm:any;
	tspl_iWidthMm:any;
	tspl_iPaddingLeft:any;
	tspl_iPaddingTop:any;
	tspl_iMarginLeft:any;
	tspl_iMarginTop:any;
	tspl_aInversion:any;
	tspl_sCodePage:any;
	tspl_iPrintSpeed:any;
	tspl_iOffsetMm:any;
	tspl_iGapMm:any;
	tspl_bTear:any;
	tspl_bCut:any;
	aTemplate:any;
	constructor(template:any) {

		this.tspl_iID =              this.inTemplate(template,'tspl_iID') ? template.tspl_iID : 1
		this.tspl_iDpi =             this.checkDpi(this.inTemplate(template,'tspl_iDpi') ? template.tspl_iDpi : 8)
		this.tspl_iDefaultFontSize = this.inTemplate(template,'tspl_iDefaultFontSize') ? template.tspl_iDefaultFontSize : 5
		this.tspl_sName =            this.inTemplate(template,'tspl_sName') ? template.tspl_sName : "Label 1"
		this.tspl_iMediaDarkness =   this.inTemplate(template,'tspl_iMediaDarkness') ? template.tspl_iMediaDarkness : 6
		this.tspl_iHeightMm =        this.inTemplate(template,'tspl_iHeightMm') ? template.tspl_iHeightMm : 10
		this.tspl_iWidthMm =         this.inTemplate(template,'tspl_iWidthMm') ? template.tspl_iWidthMm : 72
		this.tspl_iPaddingLeft =     this.inTemplate(template,'tspl_iPaddingLeft') ? template.tspl_iPaddingLeft : 0
		this.tspl_iPaddingTop =      this.inTemplate(template,'tspl_iPaddingTop') ? template.tspl_iPaddingTop : 0
		this.tspl_iMarginLeft = this.inTemplate(template, 'tspl_iMarginLeft') ? this.mmToDots(template.tspl_iMarginLeft) : 0
		this.tspl_iMarginTop = this.inTemplate(template, 'tspl_iMarginTop') ? this.mmToDots(template.tspl_iMarginTop) : 0
		this.tspl_aInversion =       this.inTemplate(template,'tspl_aInversion') ? template.tspl_aInversion : [1,0]
		this.tspl_sCodePage =        this.inTemplate(template,'tspl_sCodePage') ? template.tspl_sCodePage : "UTF-8";
		this.tspl_iPrintSpeed =      this.inTemplate(template,'tspl_iPrintSpeed') ? template.tspl_iPrintSpeed : 2;
		this.tspl_iOffsetMm =        this.inTemplate(template,'tspl_iOffsetMm') ? template.tspl_iOffsetMm : -4;
		this.tspl_iGapMm =           this.inTemplate(template,'tspl_iGapMm') ? template.tspl_iGapMm : 2.7;
		this.tspl_bTear =            this.inTemplate(template,'tspl_bTear') ? template.tspl_bTear : true;
		this.tspl_bCut =             this.inTemplate(template,'tspl_bCut') ? template.tspl_bCut : false;
		
		this.aTemplate =       (template && typeof template.aTemplate !== 'undefined') ? template.aTemplate : [];
		// this.aTemplate = [
		// 	{
		// 		type:'rectangle',
		// 		x1:1,
		// 		y1:1,
		// 		x2:175,
		// 		y2:80,
		// 		border_width:2,
		// 		border_radius:2
		// 	},
		// 	{
		// 		type:'rectangle',
		// 		x1:177,
		// 		y1:1,
		// 		x2:351,
		// 		y2:80,
		// 		border_width:2,
		// 		border_radius:2
		// 	},
		// 	{
		// 		type:'barcode',
		// 		x:8,
		// 		y:4,
		// 		content:'000000123'
		// 	},
		// 	{
		// 		type:'text',
		// 		x:8,
		// 		y:24,
		// 		text_align:'left',
		// 		content:'000000123'
		// 	},
		// 	{
		// 		type:'text',
		// 		x:8,
		// 		y:42,
		// 		font_size:8,
		// 		text_align:'left',
		// 		content:'%%SELLING_PRICE%%',
		// 		filter:'money2'
		// 	},
		// 	{
		// 		type:'text',
		// 		x:180,
		// 		y:8,
		// 		text_align:'left',
		// 		content:'%%PRODUCT_NUMBER%%'
		// 	},
		// 	{
		// 		type:'textblock',
		// 		x: 180,
		// 		y: 40,
		// 		width: 176,
		// 		height: 40,
		// 		text_align:'left',
		// 		line_height:15,
		// 		font_size:5,
		// 		content:'%%DESCRIPTION%% en nog meer',
		// 		max:10,
		// 		suffix:',,'
		// 	}
		// ]
	}

	mmToDots(mm:any):number {
		return +(Number(mm * this.tspl_iDpi).toFixed(0));
	}

	boolToOnOff(val:any) {
		return val ? 'ON' : 'OFF'
	}

	fieldNeedsData(fieldType:any) {
		return ['text','textblock','barcode','datamatrix','qrcode'].includes(fieldType)
	}

	getRotation(val:any) {
		return (val && val !== 0 && [90,180,270].includes(val)) ? val : 0
	}

	getTextAlign(val:any) {
		return (val === 'center' ? 2 : (val === 'right' ? 3 : 0))
	}

	getFontFamily(val: any) {
		return val && !isNaN(val) && val < 9 ? val : "0"
	}

	getFontSize(val: any) {
		return (val && !isNaN(val)) ? this.adjustToDpi(val) : this.adjustToDpi(this.tspl_iDefaultFontSize)
	}

	getBarcodeLabelAlignment(val: any) {
		return val ? (val === 'left' ? 1 : (val === 'center' ? 2 : (val === 'right' ? 3 : 0))) : 0
	}

	checkDpi(val: any) { 	
		return (val && val !== 0 && [8,12].includes(val)) ? val : 8
	}

	setSize(w: any, h: any) {
		return 'SIZE '+w+'mm, '+h+' mm\n'
	}

	setGap(g: any) {
		return 'GAP '+g+' mm, 0 mm\n'
	}

	setInversion(vertical=1,horizontal=0) {
		return 'DIRECTION '+vertical.toString()+','+horizontal.toString()+'\n'
	}

	setOrigin(left=0,top=0) {
		return 'REFERENCE '+left.toString()+','+top.toString()+'\n'
	}

	setShift(left=0,top=0) {
		return 'SHIFT '+left.toString()+','+top.toString()+'\n'
	}

	setSpeed(s: any) {
		return 'SPEED '+s.toString()+'\n'
	}

	setDarkness(d: any) {
		return 'DENSITY '+d.toString()+'\n'
	}

	setCodepage(cp: any) {
		return 'CODEPAGE '+cp.toString()+'\n'
	}

	setPrintOffset(o: any) {
		return 'OFFSET '+o.toString()+'mm\n'
	}

	setTear(t: any) {
		return 'SET TEAR '+t.toString()+'\n'
	}

	setCutter(c: any) {
		return 'SET CUTTER '+c.toString()+'\n'
	}

	clearBuffer() {
		return 'CLS\n'
	}

	startOfLayout(id: any) {
		return 'DOWNLOAD F,"LAYOUT'+id.toString().toUpperCase()+'.BAS"\n'
	}

	endOfLayout() {
		return 'PRINT A\nEOP\n\n'
	}

	adjustToDpi(val: any) {
		// 200dpi = 8 dots per mm
		// 300dpi = 12 dots per mm
		// We keep all dimensions in 8dpmm, and convert the values if the dpi is 12
		return !isNaN(val) ? (this.tspl_iDpi !== 8 && val !== 0 ? Math.floor(val*1.5) : val) : val
	}

	fieldText(el: any) {

		const o = {
			x:           el.x ? el.x : 8,                                 //the horizontal position of the field (x:8 = 1mm)
			y:           el.y ? el.y : 8,                                 //the vertical position of the field (x:8 = 1mm)
			font_family: this.getFontFamily(el.font_family),              //font family id: 1-8
			font_size:   this.getFontSize(el.font_size),                  //change font size, default is 5
			text_align:  this.getTextAlign(el.text_align),                //left, center or right. default: left
			rotation:    this.getRotation(el.rotation),                   //90,180 or 270. default: 0
			id:          el.id ? el.id : "",							  //DONT PASS THIS FIELD, IT'S ASSIGNED AUTOMATICALLY				
			max:         el.max ? el.max : null,                          //Maximum length of text (including the suffix!)
			suffix:      el.suffix ? el.suffix : ".."                     //The characters to indicate has been cut off 
		}

		o.x = this.adjustToDpi(o.x)
		o.y = this.adjustToDpi(o.y)

		return `TEXT ${o.x},${o.y},"${o.font_family}",${o.rotation},${o.font_size},${o.font_size},${o.text_align},${o.id}\n`
	}

	fieldTextBlock(el: any) {

		const o = {
			x:           el.x ? el.x : 8,
			y:           el.y ? el.y : 8,
			width:       el.width ? el.width : 172,
			height:      el.height ? el.height : 72,
			font_family: this.getFontFamily(el.font_family),
			font_size:   this.getFontSize(el.font_size),
			text_align:  this.getTextAlign(el.text_align),
			rotation:    this.getRotation(el.rotation),
			line_height: el.line_height ? el.line_height : 0,
			id:          el.id ? el.id : "",
			max:         el.max ? el.max : null,
			suffix:      el.suffix ? el.suffix : ".."
		}

		o.x = this.adjustToDpi(o.x)
		o.y = this.adjustToDpi(o.y)
		o.width = this.adjustToDpi(o.width)
		o.height = this.adjustToDpi(o.height)
		o.line_height = this.adjustToDpi(o.line_height)

		return `BLOCK ${o.x},${o.y},${o.width},${o.height},"${o.font_family}",${o.rotation},${o.font_size},${o.font_size},${o.line_height},${o.text_align},${o.id}\n`
	}

	fieldBarcode(el: any) {

		const o = {
			x:              el.x ? el.x : 8,
			y:              el.y ? el.y : 8,
			barcode_type:   el.barcode_type ? el.barcode_type : "128",
			height:         el.height ? el.height : 15,
			text_align:     this.getBarcodeLabelAlignment(el.text_align),
			barcode_align:	this.getTextAlign(el.barcode_align),
			rotation:       this.getRotation(el.rotation),
			bar_narrow:     el.bar_narrow ? el.bar_narrow : 2, //Width of narrow element (in dots)
			bar_wide:       el.bar_wide ? el.bar_wide : 5, //Width of wide element (in dots)
			id:             el.id ? el.id : ""
		}

		o.x = this.adjustToDpi(o.x)
		o.y = this.adjustToDpi(o.y)
		o.height = this.adjustToDpi(o.height)

		return `BARCODE ${o.x},${o.y}, "${o.barcode_type}",${o.height},${o.text_align},${o.rotation},${o.bar_narrow},${o.bar_wide},${o.barcode_align},${o.id}\n`
	}

	fieldDataMatrix(el: any) {
		const o = {
			x:              el.x ? el.x : 8,
			y:              el.y ? el.y : 8,
			size:           el.size ? el.size : 160,
			id:             el.id ? el.id : ""
		}

		return `DMATRIX ${o.x},${o.y},${o.size},${o.size},${o.id}\n`
	}

	fieldQrCode(el: any) {

		const o = {
			x:              el.x ? el.x : 8,
			y:              el.y ? el.y : 8,
			ecc:            el.ecc ? el.ecc : "H",
			cell_width:     el.cell_width ? el.cell_width : 3,
			rotation:       this.getRotation(el.rotation),
			mode:           el.mode ? el.mode : "A",
			model:          el.model ? el.model : 2,
			mask:           el.mask ? el.mask : 7,
			id:             el.id ? el.id : ""
		}

		return `QRCODE ${o.x},${o.y},${o.ecc},${o.cell_width},${o.mode},${o.rotation},M${o.model},S${o.mask},${o.id}\n`
	}

	fieldRectangle(el: any) {
		const o:any = {
			x1:              el.x1 ? el.x1 : 8,
			y1:              el.y1 ? el.y1 : 8,
			x2:              el.x2 ? el.x2 : 16,
			y2:              el.y2 ? el.y2 : 16,
			border_width:    el.border_width ? el.border_width : 1,
			border_radius:   el.border_radius ? el.border_radius : 0,
		}

		o.x1 = this.adjustToDpi(o.x1)
		o.x2 = this.adjustToDpi(o.x2)
		o.y1 = this.adjustToDpi(o.y1)
		o.y2 = this.adjustToDpi(o.y2)
		o.height = this.adjustToDpi(o.height)

		return `BOX ${o.x1},${o.y1},${o.x2},${o.y2},${o.border_width},${o.border_radius}\n`
	}

	fieldLine(el: any) {

		const o = {
			x:              el.x ? el.x : 8,
			y:              el.y ? el.y : 8,
			width:          el.width ? el.width : 16,
			height:         el.height ? el.height : 16
		}

		return `BAR ${o.x},${o.y},${o.width},${o.height}`
	}

	fieldCircle(el: any) {
		const o = {
			x:              el.x ? el.x : 8,
			y:              el.y ? el.y : 8,
			width:          el.width ? el.width : 8,
			border:         el.border ? el.border : 1
		}
		return `BAR ${o.x},${o.y},${o.width},${o.border}`
	}

	fieldDebugGrid() {

		//Create a raster of 1mm
		
		const gridW: number = this.mmToDots(this.tspl_iWidthMm)
		const gridH: number = this.mmToDots(this.tspl_iHeightMm)
		
		let grid:any = ""

		for (let i = 0; i < gridW; i += this.tspl_iDpi) {
			grid += `BAR ${i},0,2,${gridH}\n`
		}

		grid = grid + `BAR 0,${this.mmToDots(this.tspl_iHeightMm)/2},${gridW},2\n`

		// for (let i = 0; i < gridH; i+=this.iDpi) {
		// 	grid += `BAR 0,${i},${gridW},2\n`
		// }

		return grid
	}

	replacePlaceholdersWithData(content: any, productData: any) {

		var extractedVariable:any = String(content).match(/%%\w*%%/ig);
		var matchFound = false;
		
		if(extractedVariable) {
			Object.keys(productData).forEach((key, index) => {
				if(key == extractedVariable) {
					var newval = productData[extractedVariable];
					content = content.replace(extractedVariable, newval);
					matchFound = true;
				}
			});

			if(!matchFound) {
				console.warn('No data found for "' + extractedVariable + '"');
			}
		}

		return content
	}

	createSubstring(data: string, max: any,suffix="..") {
		var data = String(data);
		var suffix = String(suffix);
		return (data.length > (max - suffix.length)) ? data.substring(0,(max-suffix.length))+suffix : data;
	}

	filterContent(content: any, filter: any) {

		if(filter === 'money' || filter === 'filter1') {
			content = String(this.unicodeChars('euro')+' '+content.toString().replace('.',','))
		}

		if(filter === 'money2') {
			content = String(this.unicodeChars('euro')+' '+content.toLocaleString())
		}

		return content
	}

	addFieldsToCommand(elements: any) {
		let fieldsStr = ""
		let dataFieldCounter = 1

		for (let i = 0; i < elements.length; i++) {

			const el = elements[i];

			if(!el.type) {
				console.error(`Skipping field ${i+1}, no type provided`)
				continue
			}

			const fieldType = el.type.toLowerCase()

			if(this.fieldNeedsData(fieldType)) {
				el.id = `VAR${dataFieldCounter}$`
				dataFieldCounter += 1
			}
			
			switch (fieldType) {

				case 'text':
					fieldsStr += this.fieldText(el)
				break;

				case 'textblock':
					fieldsStr += this.fieldTextBlock(el)
				break;

				case 'barcode':
					fieldsStr += this.fieldBarcode(el)
				break;

				case 'datamatrix':
					fieldsStr += this.fieldDataMatrix(el)
				break;
				
				case 'qrcode':
					fieldsStr += this.fieldQrCode(el)
				break;

				case 'rectangle':
					fieldsStr += this.fieldRectangle(el)
				break;

				case 'line':
					fieldsStr += this.fieldLine(el)
				break;

				case 'circle':
					fieldsStr += this.fieldCircle(el)
				break;

				case 'debug':
					fieldsStr += this.fieldDebugGrid()
				break;

				default:

				break;
			}

		}

		return fieldsStr
	}

	buildLayoutJob() {

		let jobStr = this.startOfLayout(this.tspl_iID)
			+ this.setSize(this.tspl_iWidthMm, this.tspl_iHeightMm)
			+ this.setGap(this.tspl_iGapMm)
					+ this.clearBuffer()
			+ this.setInversion(this.tspl_aInversion[0], this.tspl_aInversion[1])
			+ this.setOrigin(this.tspl_iPaddingLeft, this.tspl_iPaddingTop)
			+ this.setShift(this.tspl_iMarginLeft, this.tspl_iMarginTop)
			+ this.setCodepage(this.tspl_sCodePage)
			+ this.setSpeed(this.tspl_iPrintSpeed)
			+ this.setDarkness(this.tspl_iMediaDarkness)
			+ this.setPrintOffset(this.tspl_iOffsetMm)
			+ this.setTear(this.boolToOnOff(this.tspl_bTear))
			+ this.setCutter(this.boolToOnOff(this.tspl_bCut))
					+ this.addFieldsToCommand(this.aTemplate)
					+ this.endOfLayout()

		return jobStr
	}

	buildPrintJob(layoutID = 1, productData: any,printQuantity=1) {
		// console.log(layoutID, productData, printQuantity);
		let jobStr = ""
		let dataFieldCounter = 1

		for (let i = 0; i < this.aTemplate.length; i++) {

			const el = this.aTemplate[i];

			if(!el.type) {
				console.error(`Skipping field ${i+1}, no type provided`)
				continue
			}

			const fieldType = el.type.toLowerCase()

			el.content = this.replacePlaceholdersWithData(el.content,productData)

			if(el.filter) {
				el.content = this.filterContent(el.content, el.filter)
			}

			if(el.max) {
				el.content = this.createSubstring(el.content,el.max,el.max_suffix)
			}

			if(this.fieldNeedsData(fieldType)) {
				jobStr += `VAR${dataFieldCounter}$="${el.content}"\n`
				dataFieldCounter += 1
			}
		}

		jobStr += 'A='+(printQuantity < 10 ? String('000'+printQuantity) : String('00'+printQuantity))+'\n'
		jobStr += 'LAYOUT'+layoutID.toString() + '\n\n'

		return jobStr
	}

	static exampleData = {
		'%%PRODUCT_NAME%%':'Ring Diamant',
		'%%SELLING_PRICE%%':'12345.67',
		'%%PRODUCT_NUMBER%%': 'KA123456',
		'%%ARTICLE_NUMBER%%' : '000001234',
		'%%BRAND_NAME%%': 'Kasius',
		'%%EAN%%':'8718834442003',
		'%%DIAMONDINFO%%': 'DI,SI2,H,0.13',
		'%%PRODUCT_WEIGHT%%':'3.02',
		'%%DESCRIPTION%%' : 'Ring diamant 0.13ct',
		'%%MY_OWN_COLLECTION%%':'Ringen',
		'%%VARIANTS_COLLECTION%%':'Ringen',
		'%%BRAND_COLLECTION1%%':'Ringen',
		'%%BRAND_COLLECTION2%%':'Goud',
		'%%TOTALCARATWEIGHT%%':'0.13',
		'%%LAST_DELIVIERY_DATE%%':'08-05-2020',
		'%%SUPPLIER_NAME%%' : 'Kasius NL',
		'%%SUPPLIER_CODE%%' : 'KAS',
		'%%SUGGESTED_RETAIL_PRICE%%': '5678',
		'%%PRODUCT_CATEGORY%%' : 'RINGEN',
		'%%PRODUCT_SIZE%%' : '20',
		'%%JEWEL_TYPE%%' : 'RING',
		'%%JEWEL_MATERIAL%%' : 'Goud',
		'%%STRAP_WIDTH%%' : '30mm',
		'%%STRAP_MATERIAL%%' : 'Staal'
	}

	//source: https://utf8-chartable.de/unicode-utf8-table.pl?start=8320&number=128&names=-&utf8=string-literal
	unicodeChars(k: any) {
		switch (k) {
			case 'euro':
				return '\xe2\x82\xac'	
			break;
		
			default:
				return ''
			break;
		}
	}

	inTemplate(template: any, key: any) {
		return (template && typeof template[key] !== 'undefined');
	}
}
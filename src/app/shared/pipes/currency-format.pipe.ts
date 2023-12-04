import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'currencyFormat'
})
export class CurrencyFormatPipe implements PipeTransform {
    transform(value: string,
        currencySign: string = '€ ',
        decimalDelimiter: string = ',',
        decimalLength: number = 2,
        chunkDelimiter: string = '.',
        chunkLength: number = 3): string {

        // value /= 100;
        // console.log(value, typeof value)
        value = String(value).replace(',','.');
        // console.log(value)

        let result = '\\d(?=(\\d{' + chunkLength + '})+' + (decimalLength > 0 ? '\\D' : '$') + ')';
        let num = Number(value).toFixed(Math.max(0, ~~decimalLength));
        // console.log({num})
        return currencySign + (decimalDelimiter ? num.replace('.', decimalDelimiter) : num).replace(new RegExp(result, 'g'), '$&' + chunkDelimiter);
    }
}
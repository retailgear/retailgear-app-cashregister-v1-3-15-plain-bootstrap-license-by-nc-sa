import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filter'
})

@Injectable()
export class FilterPipe implements PipeTransform {
    transform(data: Array<any>, key: any) {
        const filtered = data.filter((el) => el.key === key);
        if(filtered?.length)
            return filtered[0].aSituations;
        else 
            return [];
    } 

}
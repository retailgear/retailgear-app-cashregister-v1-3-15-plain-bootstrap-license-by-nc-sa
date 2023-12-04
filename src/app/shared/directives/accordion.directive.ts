import {
  Directive,
  ElementRef,
  HostListener, Input, OnChanges,
  Renderer2, SimpleChanges,
} from '@angular/core';

@Directive({
  selector: '.accordion',
})
export class AccordionDirective implements OnChanges {
  @Input() itemLength: number = 0;
  constructor(private renderer: Renderer2, private elem: ElementRef) { }


  ngOnChanges(changes: SimpleChanges) {
    // List if the item length is changed, if length is grown, collapse all elements in the accordion
    // last item will be opened automatically due the default class on that element
    if(changes.itemLength) {
      if(changes.itemLength.currentValue > changes.itemLength.previousValue) {
        this.closeAllElements(null)
      }
    }
  }

  /**
   * Search if the passed element has children with specific class name, and return that element
   * @param parent
   */
  getChildren(parent: any): any {
    if(parent.children && parent.children.length === 2) {
      if(parent.children[1].classList.contains('accordion-collapse') >= 0) {
        return parent.children[1]
      }
    }
    return null
  }

  /**
   * Loop through all parentElements recursively to find the right element
   * @param target
   */
  searchElement(target: any): any {
    if(target.parentElement) {
      const parent = target.parentElement
      const child = this.getChildren(parent)
      if (child) {
        return child
      } else {
        return this.searchElement(parent)
      }
    } else {
      return null
    }
  }

  /**
   * Close all elements,except for the child if that is passed
   * @param child
   */
  closeAllElements(child: any): void {
    let accordionBodies = this.elem.nativeElement.querySelectorAll('.accordion-collapse')
    accordionBodies.forEach( (e: any) => {
      if(!child || e !== child) {
        if(e.parentElement && e.parentElement.children && e.parentElement.children.length === 2) {
          this.renderer.addClass(e.parentElement.firstChild.firstChild, 'collapsed')
        }
        this.renderer.removeClass(e, 'show')
      }
    })
  }

  @HostListener("click", ['$event.target'])
  onClick(target: any): void {
    //If not the button on the accordion header is clicked but one of the elements in that header, we need to use the offsetParent of that element
    if(target.offsetParent && target.offsetParent.classList.contains('accordion-button')) {
      target = target.offsetParent
    }
    if(target.classList.contains('accordion-button')) {
      //Search for the child on the clicked element to determine which element we need to modify
      const child = this.searchElement(target)
      if (child) {
        //Child found, we can add and remove some classes, depending on which state the element currently is
        const isCollapsed = child.classList.contains('show')
        if (isCollapsed) {
          this.renderer.removeClass(child, 'show')
          this.renderer.addClass(target, 'collapsed')
        } else {
          this.renderer.addClass(child, 'show')
          this.renderer.removeClass(target, 'collapsed')
        }

        this.closeAllElements(child)
      }
    }
  }

}

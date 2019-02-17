class rolypicker {

    constructor(list, container) {
        this.list = list;
        // Declare size of picker 'cells'
        this.cellSize = 40;
        // Define these here so we know when to lazy load head / tail chunks
        this.paddingVert = 100;
        this.paddingHorz = 20;

        this.pickerSegment = document.createElement('ul');
        this.pickerSegment.classList.add('picker-segment');

        for (var i = 0; i < this.list.length; i++) {
            // Append li to picker ul
            var li = document.createElement('li');
            this.pickerSegment.appendChild(li);
            li.innerHTML = this.list[i];
            li.style.height = this.cellSize + "px";
            li.style.width = this.cellSize + "px";
        }

        // Create picker structure from template HTML
        var holder = document.createElement('div');
        holder.innerHTML = '<div class="picker"><div class="window"/></div>';
        this.picker = holder.firstChild;

        // Holder for scroll timeout ID
        var isScrolling;
        // Class reference for onscroll
        var classRef = this;

        // todo: use function refs instead?
        this.picker.onscroll = function() {
            // setTimeout returns ID of created timer, which is given to clearTimeout
            window.clearTimeout(isScrolling);
            isScrolling = setTimeout(function() {
                classRef.scrollToCell(classRef.getNearestCell());
            }, 80);

            if (this.scrollTop < classRef.paddingVert + 20) {
                classRef.addHead();
            } else if (this.scrollTop > classRef.picker.scrollHeight - (classRef.paddingVert * 3 + classRef.cellSize + 20)) {
                // todo: magic numbers
                // scrollHeight = element height + padding. need to get segment height - total padding - bottom padding so we still load new segs offscreen
                classRef.addTail();
            }
        };

        this.head = this.pickerSegment.cloneNode(true);
        this.mid = this.pickerSegment.cloneNode(true);
        this.tail = this.pickerSegment.cloneNode(true);

        this.picker.appendChild(this.head);
        this.picker.appendChild(this.mid);
        this.picker.appendChild(this.tail);

        this.picker.style.height = this.cellSize + "px";
        this.picker.style.width = this.cellSize + "px";

        this.picker.style.padding = this.paddingVert + "px " + this.paddingHorz + "px";

        // Add picker to container before adding head + tail so current scroll is at middle
        container.appendChild(this.picker);

        // todo: find a better way of centering picker - this way is a hack
        this.picker.scrollTop = this.list.length * this.cellSize;
    }

    // Get index of cell 'closest' to current scroll location
    getNearestCell() {
        return Math.round(this.picker.scrollTop / this.cellSize);
    }

    scrollToCell(index) {
        var scrollTo = index * this.cellSize;

        // todo: find more supported way of animating scroll - json 'scrollToOptions' fairly new
        this.picker.scrollTo({
            top: scrollTo,
            behavior: 'smooth'
        });
    }

    addHead() {
        if (this.picker) {
            // Get current scroll before manipulationt
            var currScroll = this.picker.scrollTop;

            var newHead = this.pickerSegment.cloneNode(true);

            this.picker.insertBefore(newHead, this.head);
            this.picker.removeChild(this.tail);

            this.tail = this.mid;
            this.mid = this.head;
            this.head = newHead;

            // Prepending new elements when scrollTop's at 0 for some reason
            // automatically scrolls to container top, to maintain scrollTop == 0.
            // Account for this by scrolling to in front of new cells.
            if (currScroll == 0) {
                this.picker.scrollTop = this.list.length * this.cellSize;
            }
        }
    }

    addTail() {
        if (this.picker) {
            this.picker.removeChild(this.head);

            this.head = this.mid;
            this.mid = this.tail;

            this.tail = this.pickerSegment.cloneNode(true);
            this.picker.appendChild(this.tail);
        }
    }
};


function getId(id) {
    return document.getElementById(id);
}

var container = getId('container');

let eight = new rolypicker([1,2,3,4,5,6,7,8], container);
let sixteen = new rolypicker([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], container);

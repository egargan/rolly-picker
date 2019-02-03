
class rolypicker {

    constructor(list) {
        this.list = list;
        // Declare size of picker 'cells'
        this.cellSize = 40;
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

            var currScroll = this.picker.scrollTop;

            // todo: create prebuilt list of nodes so we can insert in a single move
            for (var i = this.list.length - 1; i >= 0; i--) {
                var li = document.createElement('li');
                this.picker.insertBefore(li, this.picker.childNodes[1]);
                li.innerHTML = this.list[i];
            }

            // Prepending new elements when scrollTop's at 0 for some reason
            // automatically scrolls to container top, to maintain scrollTop == 0.
            // Account for this by scrolling to bottom of new cells.
            if (currScroll == 0) {
                this.picker.scrollTop = this.list.length * this.cellSize;
            }
        }
    }

    addTail() {
        if (this.picker) {
            // todo: create prebuilt list of nodes so we can insert in a single move
            for (var i = 0; i < this.list.length; i++) {
                var li = document.createElement('li');
                this.picker.appendChild(li);
                li.innerHTML = this.list[i];
            }
        }
    }

    getUl() {
        const pickerTemplate = '<ul class="picker"><div class="window"/></ul>';

        var holder = document.createElement('div');
        holder.innerHTML = pickerTemplate;

        var picker = holder.firstChild;

        // Holder for scroll timeout ID
        var isScrolling;
        var classRef = this;

        // todo: use function refs instead
        picker.onscroll = function() {
            // setTimeout returns ID of created timer, which is given to clearTimeout
            window.clearTimeout(isScrolling);
            isScrolling = setTimeout(function() {
                classRef.scrollToCell(classRef.getNearestCell());
            }, 80);
        };

        for (var i = 0; i < this.list.length; i++) {
            // Append li to picker ul
            var li = document.createElement('li');
            picker.appendChild(li);
            li.innerHTML = this.list[i];
        }

        picker.style.height = this.cellSize + "px";
        picker.style.width = this.cellSize + "px";

        // Assign to member
        this.picker = picker;

        return picker;
    }
};

function getId(id) {
    return document.getElementById(id);
}

let eight = new rolypicker([1,2,3,4,5,6,7,8]);
let sixteen = new rolypicker([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);

var container = getId('container');
container.appendChild(eight.getUl());
container.appendChild(sixteen.getUl());

eight.addTail();
eight.addHead();

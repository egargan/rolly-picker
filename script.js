
class picker {

    constructor(list) {
        this.list = list;
        // Declare size of picker 'cells'
        this.cellSize = 40;
    }

    getNearestCell() {
        // Get index of cell 'closest' to current scroll level
        return Math.round(this.picker.scrollTop / this.cellSize);
    }

    scrollToCell(index) {
        var scrollTo = index * this.cellSize;

        // todo: find more supported way of animating scroll
        this.picker.scrollTo({
            top: scrollTo,
            behavior: 'smooth'
        });
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
            }, 100);
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

let eight = new picker([1,2,3,4,5,6,7,8]);
let sixteen = new picker([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);

var container = getId('container');
container.appendChild(eight.getUl());
container.appendChild(sixteen.getUl());

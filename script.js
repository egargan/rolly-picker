
class picker {
    constructor(list) {
        this.list = list;
    }
    getUl() {
        const pickerTemplate = '<ul class="picker"><div class="window"/></ul>';

        var holder = document.createElement('div');
        holder.innerHTML = pickerTemplate;
        
        var picker = holder.firstChild;

        for (var i = 0; i < this.list.length; i++) {
            var li = document.createElement('li');
            picker.appendChild(li);
            li.innerHTML = this.list[i];
        }

        return picker;
    }
};

let eight = new picker([1,2,3,4,5,6,7,8]);
let sixteen = new picker([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);

var container = document.getElementById('container');

container.appendChild(eight.getUl());
container.appendChild(sixteen.getUl());
container.appendChild(sixteen.getUl());


class picker {
    constructor(list) {
        this.list = list;
    }
    getUl() {
        var ul = document.createElement('ul');
        ul.className += "picker";
        for (var i = 0; i < this.list.length; i++) {
            var li = document.createElement('li');
            ul.appendChild(li);
            li.innerHTML = this.list[i];
        }
        return ul;
    }
};

let eight = new picker([1,2,3,4,5,6,7,8]);
let ten = new picker([1,2,3,4,5,6,7,8,9,10,11]);

var container = document.getElementById('container');

container.appendChild(eight.getUl());
container.appendChild(ten.getUl());

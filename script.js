class PickerWheel {
    constructor(listAdapter, cellSizeParams) {
        this.cellWidth = cellSizeParams.width || 40;
        this.cellHeight = cellSizeParams.height || 40;

        // Define these here so we know when to lazy load more list data
        this.paddingVert = 100;

        // 'inflate' wheel from template HTML
        var template = document.createElement('div');
        template.innerHTML = '<div class="wheel"><div class="window"/></div>';
        this.wheelElement = template.firstChild;

        this.wheelElement.style.height = this.cellHeight + "px";
        this.wheelElement.style.width = this.cellWidth + "px";
        this.wheelElement.style.paddingTop = this.paddingVert + "px";
        this.wheelElement.style.paddingBottom = this.paddingVert + "px";

        this.wheelUl = document.createElement('ul');
        this.wheelUl.classList.add('wheel-list');
        this.wheelElement.appendChild(this.wheelUl);

        // 'this' reference for use in onscroll
        var classRef = this;
        // Holder for scroll timeout ID
        var isScrolling;

        this.wheelElement.onscroll = function() {
            window.clearTimeout(isScrolling);
            isScrolling = setTimeout(function() {
                classRef.snapToNearestCell();
            }, 80);

            // TODO: consider performance here
            // - only activate every n ticks?
            // - the 'createNewElement' calls take a substantial amount of time
            //   pre-create HTML elements in ListAdapter? or clone existing one?
            // - fix magic '30's here
            if (classRef.isScrollAboveTopBound()
                && classRef.listAdapter.isMoreListUpwards()) {
                classRef.removeBottomElements(30);
                classRef.listAdapter.releaseBottommostData(30);

                const newListData = classRef.listAdapter.requestMoreDataUpwards(30);
                classRef.prependListToWheel(newListData);

                classRef.updateExtendBounds();
            }
            else if (classRef.isScrollBelowBottomBound()
                && classRef.listAdapter.isMoreListDownwards()) {
                classRef.removeTopElements(30);
                classRef.listAdapter.releaseTopmostData(30);

                const newListData = classRef.listAdapter.requestMoreDataDownwards(30);
                classRef.appendListToWheel(newListData);

                classRef.updateExtendBounds();
            }
        };

        this.listAdapter = listAdapter;

        this.appendListToWheel(listAdapter.requestMoreDataDownwards(80));

        this.updateExtendBounds();
    }

    isScrollAboveTopBound() {
        return this.wheelElement.scrollTop <= this.extendTopBound;
    }

    isScrollBelowBottomBound() {
        return this.wheelElement.scrollTop >= this.extendBottomBound;
    }

    updateExtendBounds() {
        // TODO magic * 2s here
        this.extendTopBound = this.paddingVert * 2;

        const wheelHeightLessPadding = this.wheelElement.scrollHeight - this.paddingVert * 2;
        this.extendBottomBound = wheelHeightLessPadding - this.paddingVert * 2;
    }

    prependListToWheel(listData) {
        var headElement = this.wheelUl.childNodes[0];

        for (let i = listData.length - 1; i >= 0; i--) {
            const newElement = this.createListElement(listData[i]);
            this.wheelUl.insertBefore(newElement, headElement);
            headElement = newElement;
        }
    }

    appendListToWheel(listData) {
        for (let i = 0; i < listData.length; i++) {
            const newElement = this.createListElement(listData[i]);
            this.wheelUl.appendChild(newElement);
        }
    }

    removeTopElements(numElementsToRemove) {
        const numWheelElements = this.wheelUl.childNodes.length;
        if (numElementsToRemove > numWheelElements) {
            numElementsToRemove = numWheelElements;
        }

        for (let i = 0; i < numElementsToRemove; i++) {
            this.wheelUl.firstChild.remove();
        }
    }

    removeBottomElements(numElementsToRemove) {
        const numWheelElements = this.wheelUl.childNodes.length;
        if (numElementsToRemove > numWheelElements) {
            numElementsToRemove = numWheelElements;
        }

        for (let i = 0; i < numElementsToRemove; i++) {
            this.wheelUl.lastChild.remove();
        }
    }

    createListElement(elementText) {
        var li = document.createElement('li');

        li.innerHTML = elementText;
        li.style.height = this.cellHeight + "px";
        li.style.width = this.cellWidth + "px";

        return li;
    }

    snapToNearestCell() {
        const nearestCellIndex = Math.round(this.wheelElement.scrollTop / this.cellHeight);
        const nearestCellBase = nearestCellIndex * this.cellHeight;

        // TODO: find more supported way of animating scroll,
        // these 'scrollToOptions' objects fairly new
        this.wheelElement.scrollTo({
            top: nearestCellBase,
            behavior: 'smooth'
        });
    }

    getSelectedCell() {
        // ...
    }
}

class ListAdapter {
    constructor(list) {
        this.list = list;

        // Initialise 'active' list pointers
        this.activeListBeginIndex = 0;
        this.activeListEndIndex = 0;
    }

    getActiveList() {
        return this.list.slice(this.activeListBeginIndex, this.activeListEndIndex);
    }

    isMoreListUpwards() {
        return this.activeListBeginIndex > 0;
    }

    isMoreListDownwards() {
        return this.activeListEndIndex < this.list.length;
    }

    requestMoreDataUpwards(numRequestedElements) {
        const oldBeginIndex = this.activeListBeginIndex;

        if (this.activeListBeginIndex < numRequestedElements) {
            this.activeListBeginIndex = 0;
        }
        else {
            this.activeListBeginIndex -= numRequestedElements;
        }

        return this.list.slice(this.activeListBeginIndex, oldBeginIndex);
    }

    requestMoreDataDownwards(numRequestedElements) {
        const oldEndIndex = this.activeListEndIndex;
        const listLength = this.list.length;

        if (this.activeListEndIndex + numRequestedElements > listLength) {
            this.activeListEndIndex = listLength
        }
        else {
            this.activeListEndIndex += numRequestedElements;
        }

        return this.list.slice(oldEndIndex, this.activeListEndIndex);
    }

    releaseTopmostData(numElementsToRelease) {
        const oldBeginIndex = this.activeListBeginIndex;
        const listLength = this.list.length;

        if (this.activeListBeginIndex + numElementsToRelease > listLength) {
            this.activeListBeginIndex = listLength;
        }
        else {
            this.activeListBeginIndex += numElementsToRelease;
        }

        // Return number of elements released
        return this.activeListBeginIndex - oldBeginIndex;
    }

    releaseBottommostData(numElementsToRelease) {
        const oldEndIndex = this.activeListEndIndex;

        if (this.activeListEndIndex - numElementsToRelease <= 0) {
            this.activeListEndIndex = 0;
        }
        else {
            this.activeListEndIndex -= numElementsToRelease;
        }

        // Return number of elements released
        return oldEndIndex - this.activeListEndIndex;
    }
}

const monthDayMap = {
    January: 31, February: 28, March: 31, April: 30,
    May: 31, June: 30, July: 31, August: 31,
    September: 30, October: 31, November: 30, December: 31
};

class DateProvider {
    constructor() {

        var yearsList = [];

        for (let i = 1970; i < 2040; i++) {
            yearsList.push(i);
        }

        var months = Object.keys(monthDayMap);
        var days = [];

        for (let i = 0; i < months.length; i++) {
            const daysInMonth = monthDayMap[months[i]];
            for (let i = 1; i <= daysInMonth; i++) {
                days.push(i);
            }

        }

        var monthsList = [];
        var daysList = [];

        for (let i = 0; i < yearsList.length; i++) {
            monthsList = monthsList.concat(months);
            daysList = daysList.concat(days);
        }

        this.yearListAdapter = new ListAdapter(yearsList);
        this.monthListAdapter = new ListAdapter(monthsList);
        this.dayListAdapter = new ListAdapter(daysList);
    }

}


var thousand = [];
for (let i = 0; i < 1000; i++) {
    thousand.push(i);
}

var hundred = [];
for (let i = 0; i < 100; i++) {
    hundred.push(i);
}

var dateProvider = new DateProvider();

var wheel = new PickerWheel(dateProvider.yearListAdapter, { width: 50, height: 40 });
var wheel2 = new PickerWheel(dateProvider.monthListAdapter, { width: 90, height: 40 });
var wheel3 = new PickerWheel(dateProvider.dayListAdapter, { width: 40, height: 40 });

var container = document.getElementById('container');
container.appendChild(wheel.wheelElement);
container.appendChild(wheel2.wheelElement);
container.appendChild(wheel3.wheelElement);

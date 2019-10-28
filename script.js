class LazyWheel {
    constructor(listLoader, cellSizeParams, container) {
        this.cellWidth = cellSizeParams.width || 40;
        this.cellHeight = cellSizeParams.height || 40;
        this.paddingVert = 100;

        // Number of cells lazy loaded when approaching current end of wheel
        this.extensionSize = 20;

        // 'inflate' wheel from template HTML
        var template = document.createElement('div');
        template.innerHTML = '<div class="wheel"><div class="window"/></div>';
        this.wheelElement = template.firstChild;

        this.wheelElement.style.height = this.cellHeight + "px";
        this.wheelElement.style.width = this.cellWidth + "px";
        this.wheelElement.style.paddingTop = this.paddingVert + "px";
        this.wheelElement.style.paddingBottom = this.paddingVert + "px";

        this.liTemplate = document.createElement('li');
        this.liTemplate.style.height = this.cellHeight + "px";
        this.liTemplate.style.width = this.cellWidth + "px";

        this.wheelUl = this.createWheelListElement();
        this.wheelElement.appendChild(this.wheelUl);

        container.appendChild(this.wheelElement);

        // 'this' reference for use in onscroll
        var classRef = this;
        // Holder for scroll timeout ID
        var isScrolling;

        this.wheelElement.onscroll = function() {
            window.clearTimeout(isScrolling);
            isScrolling = setTimeout(function() {
                classRef.scrollToNearestCell();
            }, 80);

            // TODO: consider performance here
            // - only activate every n ticks?
            if (classRef.isScrollAboveTopBound()
                && classRef.listLoader.isMoreListUpwards()) {

                classRef.removeBottomElements(classRef.extensionSize);
                classRef.listLoader.releaseBottommostData(classRef.extensionSize);

                const newListData = classRef.listLoader.getMoreDataUpwards(classRef.extensionSize);
                classRef.prependListToWheel(newListData);

                classRef.updateExtendBounds();
            }
            else if (classRef.isScrollBelowBottomBound()
                && classRef.listLoader.isMoreListDownwards()) {

                classRef.removeTopElements(classRef.extensionSize);
                classRef.listLoader.releaseTopmostData(classRef.extensionSize);

                const newListData = classRef.listLoader.getMoreDataDownwards(classRef.extensionSize);
                classRef.appendListToWheel(newListData);

                classRef.updateExtendBounds();
            }
        };

        // Get initial list contents
        this.listLoader = listLoader;
        this.appendListToWheel(listLoader.getMoreDataDownwards(50));
        this.updateExtendBounds();
    }

    isScrollAboveTopBound() {
        return this.wheelElement.scrollTop <= this.extendTopBound;
    }

    isScrollBelowBottomBound() {
        return this.wheelElement.scrollTop >= this.extendBottomBound;
    }

    updateExtendBounds() {
        const boundMargin = this.paddingVert * 2;
        const wheelHeightLessPadding = this.wheelElement.scrollHeight - this.paddingVert * 2;

        this.extendTopBound = boundMargin;
        this.extendBottomBound = wheelHeightLessPadding - boundMargin;
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

    scrollToNearestCell() {
        const nearestCellIndex = Math.round(this.wheelElement.scrollTop / this.cellHeight);
        const nearestCellBase = nearestCellIndex * this.cellHeight;

        // TODO: find more supported way of scrolling, these 'scrollTo' jso args are fairly new
        this.wheelElement.scrollTo({
            top: nearestCellBase,
            behavior: 'smooth'
        });
    }

    scrollToCell(cellIndex) {
        const scrollTop = cellIndex * this.cellHeight;
        this.wheelElement.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
        });
    }

    snapToCell(cellIndex) {
        const scrollTop = cellIndex * this.cellHeight;
        this.wheelElement.scrollTop = scrollTop;
    }

    getSelectedCellIndex() {
       // ...
    }

    createWheelListElement() {
        var wheelUl = document.createElement('ul');
        wheelUl.classList.add('wheel-list');
        return wheelUl;
    }

    createListElement(elementText) {
        var newLi = this.liTemplate.cloneNode(false);
        newLi.textContent = elementText;
        return newLi;
    }

    redraw() {
        this.wheelUl.remove();

        this.wheelUl = this.createWheelListElement();
        this.wheelElement.appendChild(this.wheelUl);

        const activeList = this.listLoader.getActiveList();
        this.appendListToWheel(activeList);
    }
}

class ListLoader {
    constructor(list) {
        this.list = list;

        // Initialise 'active' list pointers
        this.setActiveListRange(0, 0);
    }

    setActiveListRange(beginIndex, endIndex) {
        this.activeListBeginIndex = beginIndex;
        this.activeListEndIndex = endIndex
        // TODO: add 'notify'-ish callback system?
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

    getMoreDataUpwards(numRequestedElements) {
        const oldBeginIndex = this.activeListBeginIndex;

        if (this.activeListBeginIndex < numRequestedElements) {
            this.activeListBeginIndex = 0;
        }
        else {
            this.activeListBeginIndex -= numRequestedElements;
        }

        return this.list.slice(this.activeListBeginIndex, oldBeginIndex);
    }

    getMoreDataDownwards(numRequestedElements) {
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

class PickerWheel {
    constructor(listData, dimens, container) {
        this.listLoader = new ListLoader(listData);
        this.wheelElement = new LazyWheel(this.listLoader, dimens, container);
    }

    snapToItem(index) {
        const numOverflowCells = this.wheelElement.extensionSize;
        var rangeBeginIndex = index - numOverflowCells;
        var rangeEndIndex = index + numOverflowCells;

        // The wheel's 'selected' cell - is centre of wheel unless near bounds
        var selectedCellIndex = numOverflowCells;

        if (rangeBeginIndex <= 0) {
            rangeBeginIndex = 0;
            selectedCellIndex = index;
        }
        if (rangeEndIndex > this.listLoader.list.length) {
            rangeEndIndex = this.listLoader.list.length;
            selectedCellIndex = selectedCellIndex;
        }

        this.listLoader.setActiveListRange(rangeBeginIndex, rangeEndIndex);
        this.wheelElement.redraw();
        this.wheelElement.snapToCell(selectedCellIndex);
    }

    scrollToItem() {
        // ...
    }

    getSelectedIndex() {
        // ...
    }

    getSelectedValue() {
        return this.listData[getSelectedIndex];
    }

    getElement() {
        return this.wheelElement.wheelElement;
    }
}

const monthDayMap = {
    January: 31, February: 28, March: 31, April: 30,
    May: 31, June: 30, July: 31, August: 31,
    September: 30, October: 31, November: 30, December: 31
};

class DatePicker {
    constructor(outerContainer) {
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

        // Wheels need to be in DOM for construction to function properly
        this.container = document.createElement('div');
        outerContainer.appendChild(this.container);

        this.yearWheel = new PickerWheel(yearsList, { width: 50, height: 40 }, this.container);
        this.monthWheel = new PickerWheel(monthsList, { width: 90, height: 40 }, this.container);
        this.dayWheel = new PickerWheel(daysList, { width: 40, height: 40 }, this.container);

        this.container.appendChild(this.yearWheel.getElement());
        this.container.appendChild(this.monthWheel.getElement());
        this.container.appendChild(this.dayWheel.getElement());
    }

    getElement() {
        return this.container;
    }
}

var container = document.getElementById('container');
var picker = new DatePicker(container);

function butt() {
    var int = parseInt(document.getElementById('tb').value, 10);
    picker.dayWheel.snapToItem(int);
}

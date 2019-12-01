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

        this.currentSelectedCellIndex = 0;

        // Holder for scroll timeout ID
        var isScrolling;
        // 'this' reference for use in onscroll
        var classRef = this;

        this.wheelElement.onscroll = function() {
            const selectedCellIndex = classRef.getSelectedCellIndex();

            // TODO: set scrollTop listeners for these instead with associated callbacks, similar to bounds system
            //       this would also address issue where we skip cells in a single scroll tick!

            if (selectedCellIndex != classRef.currentSelectedCellIndex &&
                classRef.cellEvents[selectedCellIndex] != null) {

                const cellEvent = classRef.cellEvents[selectedCellIndex];

                if (cellEvent.direction == CellEventDirection.EITHER) {
                    cellEvent.callback();
                }
                else if (selectedCellIndex < classRef.currentSelectedCellIndex &&
                    cellEvent.direction == CellEventDirection.UP) {
                    cellEvent.callback();
                }
                else if (selectedCellIndex > classRef.currentSelectedCellIndex &&
                    cellEvent.direction == CellEventDirection.DOWN) {
                    cellEvent.callback();
                }
            }

            classRef.currentSelectedCellIndex = classRef.getSelectedCellIndex();

            // TODO: consider performance here
            // - only activate every n ticks?
            if (classRef.isScrollAboveTopBound()
                && classRef.listLoader.isMoreListUpwards()) {

                classRef.removeBottomElements(classRef.extensionSize);
                classRef.listLoader.releaseBottommostData(classRef.extensionSize);

                const newListData = classRef.listLoader.getMoreDataUpwards(classRef.extensionSize);
                classRef.prependListToWheel(newListData);

                classRef.updateExtendBounds();
                classRef.cellEvents = classRef.listLoader.getActiveListEvents();
            }
            else if (classRef.isScrollBelowBottomBound()
                && classRef.listLoader.isMoreListDownwards()) {

                classRef.removeTopElements(classRef.extensionSize);
                classRef.listLoader.releaseTopmostData(classRef.extensionSize);

                const newListData = classRef.listLoader.getMoreDataDownwards(classRef.extensionSize);
                classRef.appendListToWheel(newListData);

                classRef.updateExtendBounds();
                classRef.cellEvents = classRef.listLoader.getActiveListEvents();
            }
        };

        // Get initial list contents
        this.listLoader = listLoader;
        this.appendListToWheel(listLoader.getMoreDataDownwards(50));

        this.updateExtendBounds();
        this.cellEvents = this.listLoader.getActiveListEvents();
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

    snapToNearestCell() {
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

    setSelectedCell(cellIndex) {
        const scrollTop = cellIndex * this.cellHeight;
        this.wheelElement.scrollTop = scrollTop;
    }

    getSelectedCellIndex() {
        const nearestCellIndex = Math.round(this.wheelElement.scrollTop / this.cellHeight);
        return nearestCellIndex;
    }

    getCellCount() {
        return this.wheelUl.childNodes.length;
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

        this.updateExtendBounds();
    }
}

class ListLoader {
    constructor(list) {
        // Expects a list of ListCell objects
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
        return this.list.slice(this.activeListBeginIndex, this.activeListEndIndex).map(listCell => listCell.value);
    }

    getActiveListEvents() {
        const eventDictionary = [];

        for (let i = this.activeListBeginIndex; i < this.activeListEndIndex; i++) {
            if (this.list[i].cellEvent != null) {
                const relativeIndex = i - this.activeListBeginIndex;
                eventDictionary[relativeIndex] = this.list[i].cellEvent;
            }
        }

        return eventDictionary;
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

        return this.list.slice(this.activeListBeginIndex, oldBeginIndex).map(listCell => listCell.value);
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

        return this.list.slice(oldEndIndex, this.activeListEndIndex).map(listCell => listCell.value);
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

class ListCell {
    constructor(value, cellEvent) {
        this.value = value;
        this.cellEvent = cellEvent;
    }
}

class CellEvent {
    constructor(callback, direction) {
        this.callback = callback;
        this.direction = direction;
    }
}

const CellEventDirection = {
    EITHER: null,
    DOWN: 0,
    UP: 1,
}

class PickerWheel {
    constructor(list, dimens, container) {
        this.listLoader = new ListLoader(list);
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
        this.wheelElement.setSelectedCell(selectedCellIndex);
    }

    scrollToItem() {
        // ...
    }

    tickUp() {
        const cellIndex = this.wheelElement.getSelectedCellIndex();
        if (cellIndex > 0) {
            this.wheelElement.scrollToCell(cellIndex - 1);
        }
    }

    tickDown() {
        const cellIndex = this.wheelElement.getSelectedCellIndex();
        if (cellIndex < this.wheelElement.getCellCount() - 1) {
            this.wheelElement.scrollToCell(cellIndex + 1);
        }
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

class PickerHierarchy {
    constructor(map, container) {
        // 2D array where each element is the list of cells to be given to the Nth pickerwheel
        this.pickerCellArray = [];
        this.pickerWheels = [];

        this.initialiseCellArray(map, 0, this.pickerCellArray);
        this.populatePickerCellArrays(map, 0, this.pickerCellArray);

        // TODO: dimens as argument? how would that work?
        for (let i = 0; i < this.pickerCellArray.length; i++) {
            const cellsList = this.pickerCellArray[i];
            const pickerWheel = new PickerWheel(cellsList, { width: 110, height: 40 }, container);

            this.pickerWheels.push(pickerWheel);
        }
    }

    populatePickerCellArrays(node, depth, pickerCellArray) {
        const classRef = this;

        const tickLeftWheelUpListener = new CellEvent(
            function() { classRef.pickerWheels[depth - 1].tickUp(); },
            CellEventDirection.UP
        );

        const tickLeftWheelDownListener = new CellEvent(
            function() { classRef.pickerWheels[depth - 1].tickDown(); },
            CellEventDirection.DOWN
        );

        var mapIter = node.entries();
        var iterValue = mapIter.next();

        var isFirstIteration = true;

        while (!iterValue.done) {
            const nextIterValue = mapIter.next();
            var cellEvent = null;

            if (isFirstIteration) {
                cellEvent = tickLeftWheelDownListener;
                isFirstIteration = false;
            }
            else if (nextIterValue.done) {
                // If next iteration is our last
                cellEvent = tickLeftWheelUpListener;
            }

            pickerCellArray[depth].push(new ListCell(iterValue.value[0], cellEvent));

            if (!(iterValue.value[1] == null)) {
                // If map entry has value, we expect it to be another map, so recurse
                this.populatePickerCellArrays(iterValue.value[1], depth + 1, pickerCellArray);
            }

            iterValue = nextIterValue;
        }
    }

    initialiseCellArray(node, depth, pickerCellArray) {
        pickerCellArray.push(new Array());

        const firstChild = node.values().next().value;

        if (firstChild == null) {
            return depth;
        }
        else {
            return this.initialiseCellArray(firstChild, depth + 1, pickerCellArray);
        }
    }
}

const daysInMonths = {
    January: 31, February: 28, March: 31, April: 30,
    May: 31, June: 30, July: 31, August: 31,
    September: 30, October: 31, November: 30, December: 31
};

class DatePicker {
    constructor(outerContainer) {
        const datesMap = this.constructDateMap();
        this.pickerHierarchy = new PickerHierarchy(datesMap, outerContainer);
    }

    constructDateMap() {
        var monthsDaysMap = new Map();
        const monthNames = Object.keys(daysInMonths)

        for (let i = 0; i < monthNames.length; i++) {
            const daysInMonth = daysInMonths[monthNames[i]];
            const daysMap = new Map();

            for (let day = 1; day <= daysInMonth; day++) {
                daysMap.set(day, null);
            }

            monthsDaysMap.set(monthNames[i], daysMap);
        }

        var yearsMonthsDaysMap = new Map();

        // TODO: use params for start and end years
        for (let i = 1970; i < 2040; i++) {
            yearsMonthsDaysMap.set(i, monthsDaysMap);
        }

        return yearsMonthsDaysMap;
    }

    getElement() {
        return this.container;
    }
}

var container = document.getElementById('container');
var datepicker = new DatePicker(container);

class PickerWheel {
    constructor(chunkProvider, container) {
        // Declare size of picker 'cells'
        this.cellSize = 40;
        // Define these here so we know when to lazy load head / tail chunks
        this.paddingVert = 100;
        this.paddingHorz = 20;

        // 'inflate' wheel from template HTML
        var template = document.createElement('div');
        template.innerHTML = '<div class="wheel"><div class="window"/></div>';
        this.wheelElement = template.firstChild;

        this.wheelElement.style.height = this.cellSize + "px";
        this.wheelElement.style.width = this.cellSize + "px";
        this.wheelElement.style.padding = this.paddingVert + "px " + this.paddingHorz + "px";

        // 'this' reference for use in onscroll
        var classRef = this;
        // Holder for scroll timeout ID
        var isScrolling;

        this.wheelElement.onscroll = function() {
            window.clearTimeout(isScrolling);
            isScrolling = setTimeout(function() {
                classRef.snapToNearestCell();
            }, 80);

            // TODO - consider adding multiple chunks when chunks are e.g. 1-sized?
            // TODO - consider performance here as well - only check every n ticks?
            if (classRef.isScrollAboveTopBound()
                && classRef.chunkProvider.hasNextTopChunk()) {
                classRef.addTopChunk();
                classRef.removeBottomChunk();
                classRef.updateExtendBounds();
                classRef.updateChunkBounds();
            }
            else if (classRef.isScrollAboveChunkBound()) {
                console.log('up tick!');
                classRef.updateChunkBounds();
            }
            else if (classRef.isScrollBelowChunkBound()) {
                console.log('down tick!');
                classRef.updateChunkBounds();
            }
            else if (classRef.isScrollBelowBottomBound()
                && classRef.chunkProvider.hasNextBottomChunk()) {
                classRef.addBottomChunk();
                classRef.removeTopChunk();
                classRef.updateExtendBounds();
                classRef.updateChunkBounds();
            }
        };

        this.chunkProvider = chunkProvider;
        this.chunkElements = [];

        container.appendChild(this.wheelElement);

        // Add initial chunk
        this.addBottomChunk();
        this.addBottomChunk();
        this.addTopChunk();

        this.updateExtendBounds();
        this.updateChunkBounds();
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

    isScrollAboveChunkBound() {
        return this.wheelElement.scrollTop <= this.chunkTopBound;
    }

    isScrollBelowChunkBound() {
        return this.wheelElement.scrollTop >= this.chunkBottomBound;
    }

    updateChunkBounds() {
        const selectedCellTuple = this.getSelectedCell();
        const selectedChunkIndex = selectedCellTuple[0];

        var wheelHeightBeforeMiddleChunk = 0;

        for (let i = 0; i < selectedChunkIndex; i++) {
            wheelHeightBeforeMiddleChunk += this.chunkElements[i].scrollHeight;
        }

        this.chunkTopBound = wheelHeightBeforeMiddleChunk - this.cellSize;
        this.chunkBottomBound = wheelHeightBeforeMiddleChunk + this.chunkElements[selectedChunkIndex].scrollHeight;
    }

    addTopChunk() {
        const newChunkData = this.chunkProvider.getNextTopChunk();

        if (newChunkData == null) {
            return;
        }

        const newChunkElement = this.createUlElement(newChunkData);

        const topChunkElement = this.chunkElements[0];
        this.wheelElement.insertBefore(newChunkElement, topChunkElement);

        this.chunkElements.unshift(newChunkElement);

        // Prepending new elements when scrollTop's at 0 automatically scrolls to
        // container top for some reason, to maintain scrollTop == 0?
        // Account for this by scrolling back down newly added chunk.
        if (this.wheelElement.scrollTop == 0) {
            this.wheelElement.scrollTop = newChunkData.length * this.cellSize;
        }
    }

    addBottomChunk() {
        const newChunkData = this.chunkProvider.getNextBottomChunk();

        if (newChunkData == null) {
            return;
        }

        const newChunkElement = this.createUlElement(newChunkData);

        this.wheelElement.appendChild(newChunkElement);
        this.chunkElements.push(newChunkElement);
    }

    removeTopChunk() {
        const topChunkToRemove = this.chunkElements.shift();
        this.wheelElement.removeChild(topChunkToRemove);
        this.chunkProvider.releaseTopChunk();
    }

    removeBottomChunk() {
        const bottomChunkToRemove = this.chunkElements.pop();
        this.wheelElement.removeChild(bottomChunkToRemove);
        this.chunkProvider.releaseBottomChunk();
    }

    createUlElement(listData) {
        var newChunk = document.createElement('ul');
        newChunk.classList.add('chunk');

        for (var i = 0; i < listData.length; i++) {
            var li = document.createElement('li');
            newChunk.appendChild(li);
            li.innerHTML = listData[i];
            li.style.height = this.cellSize + "px";
            li.style.width = this.cellSize + "px";
        }

        return newChunk;
    }

    snapToNearestCell() {
        const nearestCellIndex = Math.round(this.wheelElement.scrollTop / this.cellSize);
        const nearestCellBase = nearestCellIndex * this.cellSize;

        // TODO: find more supported way of animating scroll,
        // these 'scrollToOptions' objects fairly new
        this.wheelElement.scrollTo({
            top: nearestCellBase,
            behavior: 'smooth'
        });
    }

    // Assumes all cells have equal height
    getSelectedCell() {
        const nearestCellIndex = Math.round(this.wheelElement.scrollTop / this.cellSize);
        var cumulativeCellCount = 0;

        for (var i = 0; i < this.chunkElements.length; i++) {
            const ithChunkCellCount = this.chunkElements[i].childNodes.length;

            if (nearestCellIndex < cumulativeCellCount + ithChunkCellCount) {
                break;
            }

            cumulativeCellCount += ithChunkCellCount;
        }

        const selectedCellIndexInChunk = nearestCellIndex - cumulativeCellCount;

        // Return tuple of [chunk number, index]
        return [i, selectedCellIndexInChunk];
    }
}

class MonthChunkProvider {
    constructor() {
        const monthsTuples = [
            ['January', 31], ['February', 28], ['March', 31], ['April', 30],
            ['May', 31], ['June', 30], ['July', 31], ['August', 31],
            ['September', 30], ['October', 31], ['November', 30], ['December', 31]
        ];

        this.monthChunks = [];

        // TODO use JSOs versus tuples here, will look cleaner

        for (var i = 0; i < monthsTuples.length; i++) {
            var daysOfMonth = [];
            for (var day = 1; day <= monthsTuples[i][1]; day++) {
                daysOfMonth.push(day);
            }
            this.monthChunks.push([monthsTuples[i][0], daysOfMonth]);
        }

        this.liveChunksBeginIndex = 6;
        this.liveChunksEndIndex = 6;
    }

    getNextBottomChunk() {
        if (!this.hasNextBottomChunk()) {
            return null;
        }

        // TODO index mutations quite side-effecty here, probs better to make separate method?
        // 'claimNextChunk' vs 'getChunk'?
        this.liveChunksEndIndex++;
        const nextBottomChunk = this.monthChunks[this.liveChunksEndIndex];
        return nextBottomChunk[1];
    }

    releaseBottomChunk() {
        // TODO: this interface feels a bit too manual
        // but it's sort of required bc we need to maintain consistency between
        // the chunk provider and the wheel chunks..
        this.liveChunksEndIndex--;
    }

    getNextTopChunk() {
        if (!this.hasNextTopChunk()) {
            return null;
        }

        this.liveChunksBeginIndex--;
        const nextTopChunk = this.monthChunks[this.liveChunksBeginIndex];
        return nextTopChunk[1];
    }

    releaseTopChunk() {
        this.liveChunksBeginIndex++;
    }

    hasNextTopChunk() {
        return this.liveChunksBeginIndex > 0;
    }

    hasNextBottomChunk() {
        return this.liveChunksEndIndex < this.monthChunks.length - 1;
    }
}

var container = document.getElementById('container');
var wheel = new PickerWheel(new MonthChunkProvider(), container);

var container = document.getElementById('container');
var wheel2 = new PickerWheel(new MonthChunkProvider(), container, wheel);

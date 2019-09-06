$(function () {
    var editIndex = undefined;
    function endEditing() {
        if (editIndex == undefined) {
            return true
        }
        $('#table').datagrid('endEdit', editIndex);
        editIndex = undefined;
        return true;
    }

    function onClickRow(index) {
        console.log(index)
        if (editIndex != index) {
            if (endEditing()) {
                $('#table').datagrid('selectRow', index)
                    .datagrid('beginEdit', index);
                editIndex = index;
            } else {
                $('#table').datagrid('selectRow', editIndex);
            }
        }
    }

    function append() {
        if (endEditing()) {
            $('#table').datagrid('appendRow', {
                status: 'P'
            });
            editIndex = $('#table').datagrid('getRows').length - 1;
            $('#table').datagrid('selectRow', editIndex)
                .datagrid('beginEdit', editIndex);
        }
    }

    function removeit() {
        if (editIndex == undefined) {
            return
        }
        console.log(1212);
        console.log(editIndex);
        $('#table').datagrid('cancelEdit', editIndex)
            .datagrid('deleteRow', editIndex);
        editIndex = undefined;
    }

    function accept() {
        if (endEditing()) {
            $('#table').datagrid('acceptChanges');
        }
    }

    function reject() {
        $('#table').datagrid('rejectChanges');
        editIndex = undefined;
    }


    var toolbar = [{
        text: 'Add',
        iconCls: 'icon-add',
        handler: append
    }, {
        text: 'Remove',
        iconCls: 'icon-remove',
        handler: removeit
    }, {
        text: 'Save',
        iconCls: 'icon-save',
        handler: accept
    }, '-', {
        text: 'Undo',
        iconCls: 'icon-undo',
        handler: reject
    }, '-', {
        text: '编辑表头',
        iconCls: 'icon-edit',
        handler: function () {
            window.open('editColumn.html');
        }
    }];

    // 根据请求的数据生成 column 结构
    function initColumn(data) {
        var column1 = [];
        var column2 = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i].type === "merge") {
                if (data[i].children && data[i].children.length > 0) {
                    // 2、二维第一
                    column1.push({
                        title: data[i].name,
                        colspan: data[i].children.length
                    })
                    // 3、二维第二
                    for (var j = 0; j < data[i].children.length; j++) {
                        column2.push({
                            field: data[i].children[j].id,
                            title: data[i].children[j].name,
                            editor: data[i].children[j].editor,
                        })
                    }
                }
            } else {
                // 1、只有一维
                column1.push({
                    field: data[i].id,
                    title: data[i].name,
                    editor: data[i].editor,
                    rowspan: 2
                })
            }
        }
        if (column1.length === 0) {
            return [];
        } else if (column2.length === 0) {
            return [column1];
        } else {
            return [column1, column2];
        }
    }


    // 遍历 增加图标
    function addIcon(data) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].type === "merge") {
                data[i].iconCls = 'icon-my1';
                if (data[i].children && data[i].children.length) {
                    for (var j = 0; j < data[i].children.length; j++) {
                        data[i].children[j].iconCls = 'icon-my2';
                    }
                }
            } else {
                data[i].iconCls = 'icon-my2';
            }
        }
    }


    if (localStorage.getItem("columns")) {
        var data = JSON.parse(localStorage.getItem("columns"));
        var tableHead = initColumn(data);
        $('#table').datagrid({
            columns: tableHead,
            fitColumns: true,
            ctrlSelect: true,
            singleSelect: false,
            rownumbers: true,
            singleSelect: true,
            url: 'json/datagrid_data1.json',
            method: 'get',
            toolbar: toolbar,
            onClickRow: onClickRow

        });
    } else {
        $.get('json/head.json', function (data) {
            // 生成表头，然后初始化表格
            var tableHead = initColumn(data);
            $('#table').datagrid({
                columns: tableHead,
                fitColumns: true,
                ctrlSelect: true,
                singleSelect: false,
                rownumbers: true,
                singleSelect: true,
                url: 'json/datagrid_data1.json',
                method: 'get',
                toolbar: toolbar,
                onClickRow: onClickRow
            });
        });
    }


})
var toolbar = [{
    text: 'Add',
    iconCls: 'icon-add',
    handler: function () { alert('add') }
}, {
    text: 'Cut',
    iconCls: 'icon-cut',
    handler: function () { alert('cut') }
}, '-', {
    text: 'Save',
    iconCls: 'icon-edit',
    handler: function () { alert('save') }
}, '-', {
    text: '编辑表头',
    iconCls: 'icon-save',
    handler: function () {
        $('#editcolumn').toggle();
    }
}];

// 根据请求的数据生成 column 结构
function initColumn(data) {
    var column1 = [];
    var column2 = [];
    for (var i = 0; i < data.length; i++) {
        if (data[i].type === "merge") {
            if (data[i].children&&data[i].children.length) {
                // 2、二维第一
                column1.push({
                    title: data[i].name,
                    colspan: data[i].children.length
                })
                // 3、二维第二
                for (var j = 0; j < data[i].children.length; j++) {
                    column2.push({
                        field: data[i].children[j].key,
                        title: data[i].children[j].name,
                    })
                }
            }

        } else {
            // 1、只有一维
            column1.push({
                field: data[i].key,
                title: data[i].name,
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

$.get('json/head.json', function (data) {
    // 生成表头，然后初始化表格
    var tableHead = initColumn(data);
    setTimeout(function () {
        $('#table').datagrid({
            columns: tableHead,
            fitColumns: true,
            ctrlSelect: true,
            singleSelect: false,
            rownumbers: true,
            singleSelect: true,
            url: 'json/datagrid_data1.json',
            method: 'get',
            toolbar: toolbar
        });

    }, 500)
});

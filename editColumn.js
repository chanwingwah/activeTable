var editingId;
var editingNew = false;
var toolbar = [{
    text: '新增',
    iconCls: 'icon-add',
    handler: append(true)
}, {
    text: '新增组合列',
    iconCls: 'icon-add',
    handler: append(true, 'merge')
}, {
    text: '删除',
    iconCls: 'icon-remove',
    handler: function () {
        if (editingId != undefined) {
            $.messager.alert('警告', '请先取消或保存编辑的操作');
            return false;
        }
        // if (editingId == null) {
        var row = $('#tg').treegrid('getSelected');
        if (row) {
            editingId = row.id;
            var tips = row.type === 'data' ? '您确认想要删除这个列吗？该列的数据会同时删除，无法撤回' : '您确认想要删除这个组合列吗？该组合列下的列以及数据会同时删除，无法撤回'
        }
        // }
        if (editingId != undefined) {

            $.messager.confirm('确认', tips, function (r) {
                if (r) {
                    $('#tg').treegrid('cancelEdit', editingId)
                        .datagrid('deleteRow', editingId);
               
                    // 同步到远程
                    localStorage.setItem('columns', JSON.stringify($('#tg').treegrid('getData')));

                }
                editingId = undefined;
            });
            return;
        }
    }
}, '-', {
    text: '编辑',
    iconCls: 'icon-edit',
    handler: function () {
        if (editingId != undefined) {
            $('#tg').treegrid('select', editingId);
            return;
        }
        var row = $('#tg').treegrid('getSelected');
        if (row) {
            editingId = row.id
            $('#tg').treegrid('beginEdit', editingId);
        }
    }
}, '-', {
    text: '保存',
    iconCls: 'icon-save',
    handler: function () {
        if (editingId != undefined) {
            // 保存需要校验，值不为空
            var val1 = $('#tg').treegrid('getEditor', { id: editingId, field: 'name' }).target[0].value
            var val2 = $('#tg').treegrid('getEditor', { id: editingId, field: 'des' }).target[0].value
            // console.log(val1,val2,val3)
            var t = $('#tg');
            t.treegrid('endEdit', editingId);
            editingId = undefined;
            editingNew = false;
            // 同步到远程
            localStorage.setItem('columns', JSON.stringify($('#tg').treegrid('getData')));
        }
    }
}, '-', {
    text: '取消',
    iconCls: 'icon-cancel',
    handler: function () {
        if (editingId != undefined) {
            $('#tg').treegrid('cancelEdit', editingId);
            // 假如是在新增的过程中取消，删除该行
            if (editingNew) {
                $('#tg').treegrid('cancelEdit', editingId)
                    .datagrid('deleteRow', editingId);
                editingNew = false;
            }
            editingId = undefined;
        }
    }
}];

// function formatType(value, row, index) {
//     if (value === "merge") {
//         value = '合并列';
//     } else {
//         value = '数据列';
//     }
//     return value;
// }

function editFormatter(value, row, index) {
    if (value == null) {
        return "";
    }
    return value;
}



var editorCombo = {
    type: 'combobox',
    options: {
        valueField: 'value',
        textField: 'label',
        editable:false,
        data: [{
            label: '不编辑（空）',
            value: null
        }, {
            label: 'text',
            value: 'text'
        }, {
            label: 'textarea',
            value: 'textarea'
        }, {
            label: 'datebox',
            value: 'datebox'
        }, {
            label: 'numberbox',
            value: 'numberbox'
        }]
    }
};

var mappingObj = [];
editorCombo.options.data.forEach(function (val, index) {
    mappingObj.push(val.value)
})

var editorCombo2 = {
    type: 'combobox',
    editable:false,
    options: {
        valueField: 'value',
        textField: 'label',
        data: [{
            label: '数据列',
            value: 'data'
        }, {
            label: '合并列',
            value: 'merge'
        }]
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

function onContextMenu(e, row) {
    if (row) {
        e.preventDefault();
        $(this).treegrid('select', row.id);
        if (row.type === 'merge') {
            $('#mm').menu('show', {
                left: e.pageX,
                top: e.pageY
            });
        } else if (row.parent == null) {
            $('#mm2').menu('show', {
                left: e.pageX,
                top: e.pageY
            });
        } else {
            $('#mm3').menu('show', {
                left: e.pageX,
                top: e.pageY
            });
        }
    }
}

if (!localStorage.getItem('idCount')) {
    localStorage.setItem('idCount', 100);
}

function append(root, type) {
    var _root = root || false;
    var _type = type || "data";
    return function () {

        var idIndex = parseInt(localStorage.getItem('idCount'));
        localStorage.setItem('idCount', idIndex + 1);
        idIndex = 'key' + idIndex;
        if (editingId != undefined) {
            $.messager.alert('警告', '请先取消或保存编辑的操作');
            return false;
        };

        var pid;
        if (_root) {
            pid = undefined;
        } else {
            var node = $('#tg').treegrid('getSelected');
            if (node) {
                pid = node.id;
            }
        }

        //  创建逻辑 , 先页面上创建并且生成列，进入编辑状态， 假如取消，就是不创建，保存的话，就完成与数据库更新并且利用返回的Id来替换
        //  保存需要进行数据校验
        $('#tg').treegrid('append', {
            parent: pid,
            data: [{
                id: idIndex,
                name: 'New Task' + idIndex,
                type: _type,
                editor: _type === 'data' ? 'text' : null,
                iconCls: _type === 'data' ? 'icon-my2' : 'icon-my1',
                // progress: parseInt(Math.random() * 100)
            }]
        });
        editingId = idIndex;
        console.log(editingId);
        $('#tg').treegrid('selectRow', editingId)
            .treegrid('beginEdit', editingId);
        editingNew = true;
    }

}
function removeIt() {
    var node = $('#tg').treegrid('getSelected');
    if (node) {
        $('#tg').treegrid('remove', node.id);
        // 同步到远程
        localStorage.setItem('columns', JSON.stringify($('#tg').treegrid('getData')));
    }
}
function collapse() {
    var node = $('#tg').treegrid('getSelected');
    if (node) {
        $('#tg').treegrid('collapse', node.id);
    }
}
function expand() {
    var node = $('#tg').treegrid('getSelected');
    if (node) {
        $('#tg').treegrid('expand', node.id);
    }
}


var columndata;
if (localStorage.getItem('columns')) {
    columndata = JSON.parse(localStorage.getItem('columns'));
    $('#tg').treegrid({
        data: columndata,
        toolbar: toolbar,
    })
} else {
    $.get('json/head.json', function (data2) {
        // 生成表头，然后初始化表格
        addIcon(data2);
        localStorage.setItem("columns", JSON.stringify(data2));
        columndata = data2;
        console.log(columndata)
        $('#tg').treegrid({
            data: columndata,
            toolbar: toolbar
        })

    })
}


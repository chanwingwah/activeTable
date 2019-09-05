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
                        .treegrid('deleteRow', editingId);
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
            var val1 = $('#tg').treegrid('getEditor', {
                id: editingId,
                field: 'name'
            }).target[0];
            var val2 = $('#tg').treegrid('getEditor', {
                id: editingId,
                field: 'des'
            }).target[0];
            if (!val1.value) {
                $.messager.alert('警告', '表头名不允许是空值', null, function () {
                    val1.focus();
                });
                return;
            }
            if (!val2.value) {
                $.messager.alert('警告', '请添加描述', null, function () {
                    val2.focus();
                });

                return;
            }
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
        editable: false,
        panelHeight: 'auto',
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
    editable: false,
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

//  右键菜单
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


//  设置新ID递增
if (!localStorage.getItem('idCount')) {
    localStorage.setItem('idCount', 100);
}

//  添加
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
            pid = null;
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
                parent: pid,
                name: 'New Key' + idIndex,
                des: 'New des' + idIndex,
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
//  删除
function removeIt() {
    var node = $('#tg').treegrid('getSelected');
    if (node) {
        $('#tg').treegrid('remove', node.id);
        // 同步到远程
        localStorage.setItem('columns', JSON.stringify($('#tg').treegrid('getData')));
    }
}

// 获取组列表
function getGroups() {
    var allColumn = JSON.parse(localStorage.getItem('columns'));
    var groupArray = allColumn.filter(function (item, index) {
        if (item.type === 'merge') {
            return true;
        }
    })
    console.log('groupArray', groupArray);
    return groupArray;
}


function popInset() {
    if (editingId != undefined) {
        $.messager.alert('警告', '请先取消或保存编辑的操作');
        return false;
    }
    var node = $('#tg').treegrid('getSelected');
    if (node) {
        console.log(node);
        var after = node.parent;
        var data = $('#tg').treegrid('pop', node.id);
        data.parent = null;
        console.log(after, data)
        $('#tg').treegrid('insert', {
            after: after,
            data: data
        });
        // 同步到远程
        localStorage.setItem('columns', JSON.stringify($('#tg').treegrid('getData')));
    }
}

function moveToGroup() {
    if (editingId != undefined) {
        $.messager.alert('警告', '请先取消或保存编辑的操作');
        return false;
    }
    var node = $('#tg').treegrid('getSelected');
    var groupArray = getGroups();
    $('#cc').combobox({
        data: groupArray,
        editable: false,
        onSelect: function () {
            $('#btnOK').linkbutton('enable');
        }
    });
    $('#btnOK').linkbutton('disable');
    $('#w').window({
        title: '请选择[' + node.name + ']添加到的组'
    }).window('open');
}

function confirmToGroup() {
    // pop,然后插入，假如parent与插入一致，不操作
    var node = $('#tg').treegrid('getSelected');
    var select = $('#cc').combobox('getValue');
    console.log(select);
    if (select !== node.parent) {
        var data = $('#tg').treegrid('pop', node.id);
        console.log('data', data)
        data.parent = null;
        var dataArr = [];
        dataArr.push(data);
        $('#tg').treegrid('append', {
            parent: select,
            data: dataArr
        });
        // 同步到远程
        localStorage.setItem('columns', JSON.stringify($('#tg').treegrid('getData')));
    }
    $('#w').window('close');
}

function moveColumn(direction) {
    if (editingId != undefined) {
        $.messager.alert('警告', '请先取消或保存编辑的操作');
        return false;
    }
    var node = $('#tg').treegrid('getSelected');
    console.log(node)
    // 寻找前和后
    var dataArr;
    if (node.parent) {
        dataArr = $('#tg').treegrid('getParent', node.id).children;
    } else {
        dataArr = $('#tg').treegrid('getData');
    }

    var targetId;
    // 获取目标节点
    dataArr.some(function (item, index, arr) {
        if (item.id === node.id) {
            var max = direction == "up" ? 0 : arr.length - 1;
            var targetindex = direction == "up" ? index - 1 : index + 1;
            if (index === max) {
                targetId = null;
            } else {
                targetId = arr[targetindex].id;
            }
            return true;
        }
    });
    if (targetId) {
        var params = {
            data: $('#tg').treegrid('pop', node.id)
        }
        params[direction == "up" ? 'before' : 'after'] = targetId
        $('#tg').treegrid('insert', params);

        // 同步到远程
        localStorage.setItem('columns', JSON.stringify($('#tg').treegrid('getData')));
    } else {
        $.messager.alert('提示', '已无法' + (direction == "up" ? '向上' : '往下') + '移');
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
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Row, Col, Button, Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { addProject, fetchProjectList, delProject, changeUpdateModal } from '../../../reducer/modules/project';
import ProjectCard from '../../../components/ProjectCard/ProjectCard.js';
import ErrMsg from '../../../components/ErrMsg/ErrMsg.js';
import { autobind } from 'core-decorators';
import { setBreadcrumb } from '../../../reducer/modules/user';

import './ProjectList.scss';

@connect(
  state => {
    return {
      projectList: state.project.projectList,
      userInfo: state.project.userInfo,
      tableLoading: state.project.tableLoading,
      currGroup: state.group.currGroup,
      currPage: state.project.currPage
    }
  },
  {
    fetchProjectList,
    addProject,
    delProject,
    changeUpdateModal,
    setBreadcrumb
  }
)
class ProjectList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      protocol: 'http:\/\/',
      projectData: []
    }
  }
  static propTypes = {
    form: PropTypes.object,
    fetchProjectList: PropTypes.func,
    addProject: PropTypes.func,
    delProject: PropTypes.func,
    changeUpdateModal: PropTypes.func,
    projectList: PropTypes.array,
    userInfo: PropTypes.object,
    tableLoading: PropTypes.bool,
    currGroup: PropTypes.object,
    setBreadcrumb: PropTypes.func,
    currPage: PropTypes.number,
    studyTip: PropTypes.number,
    study: PropTypes.bool
  }

  // 取消修改
  @autobind
  handleCancel() {
    this.props.form.resetFields();
    this.setState({
      visible: false
    });
  }

  // 修改线上域名的协议类型 (http/https)
  @autobind
  protocolChange(value) {
    this.setState({
      protocol: value
    })
  }

  // 获取 ProjectCard 组件的关注事件回调，收到后更新数据
  @autobind
  receiveRes() {
    this.props.fetchProjectList(this.props.currGroup._id, this.props.currPage);
  }

  componentWillReceiveProps(nextProps) {
    this.props.setBreadcrumb([{ name: '' + (nextProps.currGroup.group_name || '') }]);

    // 切换分组
    if (this.props.currGroup !== nextProps.currGroup) {
      if (nextProps.currGroup._id) {
        this.props.fetchProjectList(nextProps.currGroup._id, this.props.currPage)
      }
    }

    // 切换项目列表
    if (this.props.projectList !== nextProps.projectList) {
      // console.log(nextProps.projectList);
      const data = nextProps.projectList.map((item, index) => {
        item.key = index;
        return item;
      });
      this.setState({
        projectData: data
      });
    }
  }

  render() {
    let projectData = this.state.projectData;
    let noFollow = [];
    let followProject = [];
    for(var i in projectData){
      if(projectData[i].follow){
        followProject.push(projectData[i]);
      }else{
        noFollow.push(projectData[i]);
      }
    }
    followProject = followProject.sort((a,b)=>{
      return b.up_time - a.up_time;
    })
    noFollow = noFollow.sort((a,b)=>{
      return b.up_time - a.up_time;
    })
    projectData = [...followProject,...noFollow]
    return (
      <div style={{ paddingTop: '24px' }} className="m-panel card-panel card-panel-s project-list" >
        <Row className="project-list-header">
          <Col span={16} style={{ textAlign: 'left' }}>
            {this.props.currGroup.group_name}分组 共 {projectData.length} 个项目
          </Col>
          <Col>
            {/(admin)|(owner)|(dev)/.test(this.props.currGroup.role) ?
              <Button type="primary"><Link to="/add-project">添加项目</Link></Button>:
              <Tooltip title="您没有权限,请联系该分组组长或管理员">
                <Button type="primary" disabled >添加项目</Button>
              </Tooltip>}
          </Col>
        </Row>
        <Row gutter={16}>
          {projectData.length ? projectData.map((item, index) => {
            return (
              <Col xs={8} md={6} xl={4}  key={index}>
                <ProjectCard projectData={item} callbackResult={this.receiveRes} />
              </Col>);
          }) : <ErrMsg type="noProject" />}
        </Row>
      </div>
    );
  }
}

export default ProjectList;
